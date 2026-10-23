import { useCallback, useEffect, useState } from 'react';
import { getWeek } from '../api';
import { useNewDay } from '../useNewDay';
import { addDays, dayLabel, weekRange } from '../dates';
import { formatKcal } from '../numbers';
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, HistoryIcon } from './Icons';

// "Burned 300 kcal · added to the budget", or null for a day with no exercise
function burnedText(day)
{
    if (day.burnedKcal === 0) return null;
    const added = day.budgetKcal > day.targetKcal; // that day added exercise to its budget
    return `Burned ${formatKcal(day.burnedKcal)} kcal${added ? ' · added to the budget' : ''}`;
}

// The pill colour for a day's status: no colour (grey) when nothing was logged
function pillFor(day, isOver)
{
    if (!day.logged) return '';
    return isOver ? 'pill-danger' : 'pill-success';
}

// One day: its total against that day's budget (the target, + exercise if that day added it),
// as a thin bar plus the same thing in words. The words carry the meaning (over / under / not logged);
// the colour only repeats it.
function DayRow({ day, today, onOpen })
{
    const isOver = day.logged && day.eatenKcal > day.budgetKcal;
    const difference = day.logged ? Math.abs(day.eatenKcal - day.budgetKcal) : 0;
    const filled = day.logged ? Math.min(day.eatenKcal / day.budgetKcal, 1) * 100 : 0;
    const burned = burnedText(day);

    let status = 'Not logged';
    if (day.logged) status = isOver ? `Over by ${formatKcal(difference)}` : `${formatKcal(difference)} under`;
    const spoken = day.logged ? `${formatKcal(day.eatenKcal)} of ${formatKcal(day.budgetKcal)} kcal, ${status}` : status;

    return (
        <button className="row-button" onClick={() => onOpen(day.date)} aria-label={`${dayLabel(day.date, today)}: ${spoken}${burned ? `. ${burned}` : ''}. Open this day.`}>
            <span className="history-row">
                <span className="history-day">{dayLabel(day.date, today)}</span>
                <span className="history-kcal num">
                    {day.logged ? (
                        <><strong>{formatKcal(day.eatenKcal)}</strong> / {formatKcal(day.budgetKcal)} kcal</>
                    ) : '–'}
                </span>
                {/* aria-hidden: the button's label already says all of this in words */}
                <span className="meter" aria-hidden="true">
                    {day.logged && <span className={isOver ? 'meter-fill over' : 'meter-fill'} style={{ width: `${filled}%` }} />}
                </span>
                {/* A pill: rose when over, mint when under, grey when not logged. The words say which, too. */}
                <span className={`history-status pill ${pillFor(day, isOver)}`}>{status}</span>
                {burned && <span className="history-burned num">{burned}</span>}
            </span>
        </button>
    );
}

// The History page: the weekly average (the one big number), then each of the 7 days.
// Arrows step a week at a time. Tapping a day opens it on Today, e.g. to log something you forgot.
function History({ onOpenDay })
{
    const [endDate, setEndDate] = useState(null); // null = the 7 days ending today
    const [today, setToday] = useState(null); // 'YYYY-MM-DD', learnt from the first load
    const [week, setWeek] = useState(null);
    const [loadError, setLoadError] = useState(null);

    const loadWeek = useCallback(() => {
        getWeek(endDate)
            .then((loaded) => {
                setWeek(loaded);
                if (endDate === null) setToday(loaded.endDate);
            })
            .catch((err) => setLoadError(err.message));
    }, [endDate]);

    useEffect(() => {
        loadWeek();
    }, [loadWeek]);

    // While showing the last 7 days: after midnight, the week moves on by a day
    useNewDay(loadWeek, endDate === null);

    const goToWeek = (end) => {
        setWeek(null);
        setLoadError(null);
        setEndDate(end === today ? null : end);
    };

    const retry = () => {
        setLoadError(null);
        loadWeek();
    };

    const isThisWeek = endDate === null;

    let content;
    if (loadError)
    {
        content = (
            <section className="card empty-state" role="alert">
                <span className="empty-icon" aria-hidden="true"><AlertIcon /></span>
                <p className="empty-title">Couldn't load your history.</p>
                <p className="muted">{loadError}</p>
                <button className="btn btn-primary" onClick={retry}>Try again</button>
            </section>
        );
    }
    else if (!week)
    {
        content = <p className="muted loading" role="status">Loading…</p>;
    }
    else
    {
        // Against the average budget: the same as the target unless exercise was added to it
        const difference = week.averageKcal === null ? 0 : week.averageKcal - week.averageBudgetKcal;
        const addsExercise = week.averageBudgetKcal !== week.averageTargetKcal;
        const versus = addsExercise ? 'budget' : 'target';
        content = (
            <>
                {week.loggedDays === 0 ? (
                    <section className="card empty-state">
                        <span className="empty-icon" aria-hidden="true"><HistoryIcon size={20} /></span>
                        <p className="empty-title">Nothing logged in these 7 days</p>
                        <p className="muted">Days you log show up here, with their total against your target.</p>
                    </section>
                ) : (
                    <section className="card summary-card" aria-label="Weekly average">
                        <p className="card-label">Daily average</p>
                        <p className="hero-number num">
                            {formatKcal(week.averageKcal)}<span className="hero-unit"> kcal</span>
                        </p>
                        <p className="summary-totals">
                            {difference > 0
                                ? `${formatKcal(difference)} kcal over ${versus} on average`
                                : `${formatKcal(-difference)} kcal under ${versus} on average`}
                        </p>
                        {week.averageBurnedKcal > 0 && (
                            <p className="summary-formula num">
                                {formatKcal(week.averageBurnedKcal)} kcal a day burned in exercise
                                {addsExercise
                                    ? ` (budget ${formatKcal(week.averageBudgetKcal)} = target ${formatKcal(week.averageTargetKcal)} + exercise)`
                                    : ', not added to your budget'}
                            </p>
                        )}
                        <p className="summary-macros">
                            Average of the {week.loggedDays} {week.loggedDays === 1 ? 'day' : 'days'} you logged food
                            (target {formatKcal(week.averageTargetKcal)} kcal). Days you didn't log aren't counted as 0.
                        </p>
                    </section>
                )}

                {/* Newest first: the day you're most likely looking for is at the top */}
                <ul className="card list-card" aria-label="Days">
                    {[...week.days].reverse().map((day) => (
                        <li key={day.date}>
                            <DayRow day={day} today={today} onOpen={(date) => onOpenDay(date, today)} />
                        </li>
                    ))}
                </ul>
            </>
        );
    }

    return (
        <div className="history">
            <div className="week-nav">
                <p className="week-label">
                    {isThisWeek ? 'Last 7 days' : week ? weekRange(week.startDate, week.endDate) : 'Loading…'}
                    {isThisWeek && week && <span className="muted"> · {weekRange(week.startDate, week.endDate)}</span>}
                </p>
                <div className="day-arrows">
                    <button className="icon-btn" aria-label="Previous 7 days" disabled={!week} onClick={() => goToWeek(addDays(week.endDate, -7))}>
                        <ChevronLeftIcon />
                    </button>
                    <button className="icon-btn" aria-label="Next 7 days" disabled={!week || isThisWeek} onClick={() => goToWeek(addDays(week.endDate, 7))}>
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>

            {content}
        </div>
    );
}

export default History;
