import { useCallback, useEffect, useState } from 'react';
import { getWeek } from '../api';
import { useNewDay } from '../useNewDay';
import { addDays, dayLabel, weekRange } from '../dates';
import { formatKcal } from '../numbers';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

// One day: its total against that day's target, as a thin bar plus the same thing in words.
// The words carry the meaning (over / under / not logged); the colour only repeats it.
function DayRow({ day, today, onOpen })
{
    const isOver = day.logged && day.eatenKcal > day.targetKcal;
    const difference = day.logged ? Math.abs(day.eatenKcal - day.targetKcal) : 0;
    const filled = day.logged ? Math.min(day.eatenKcal / day.targetKcal, 1) * 100 : 0;

    let status = 'Not logged';
    if (day.logged) status = isOver ? `Over by ${formatKcal(difference)}` : `${formatKcal(difference)} under`;

    return (
        <button className="row-button" onClick={() => onOpen(day.date)} aria-label={`${dayLabel(day.date, today)}: ${day.logged ? `${formatKcal(day.eatenKcal)} of ${formatKcal(day.targetKcal)} kcal, ${status}` : status}. Open this day.`}>
            <span className="history-row">
                <span className="history-day">{dayLabel(day.date, today)}</span>
                <span className="history-kcal num">
                    {day.logged ? (
                        <><strong>{formatKcal(day.eatenKcal)}</strong> / {formatKcal(day.targetKcal)} kcal</>
                    ) : '–'}
                </span>
                {/* aria-hidden: the button's label already says all of this in words */}
                <span className="meter" aria-hidden="true">
                    {day.logged && <span className={isOver ? 'meter-fill over' : 'meter-fill'} style={{ width: `${filled}%` }} />}
                </span>
                <span className={isOver ? 'history-status over' : 'history-status'}>{status}</span>
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
                <p>Couldn't load your history.</p>
                <p className="muted">{loadError}</p>
                <button className="btn" onClick={retry}>Try again</button>
            </section>
        );
    }
    else if (!week)
    {
        content = <p className="muted" role="status">Loading…</p>;
    }
    else
    {
        const difference = week.averageKcal === null ? 0 : week.averageKcal - week.averageTargetKcal;
        content = (
            <>
                {week.loggedDays === 0 ? (
                    <section className="card empty-state">
                        <p><strong>Nothing logged in these 7 days</strong></p>
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
                                ? `${formatKcal(difference)} kcal over target on average`
                                : `${formatKcal(-difference)} kcal under target on average`}
                        </p>
                        <p className="summary-macros">
                            Average of the {week.loggedDays} {week.loggedDays === 1 ? 'day' : 'days'} you logged
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
