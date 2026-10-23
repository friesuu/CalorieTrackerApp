import { useEffect, useState } from 'react';
import { getDailyLog, getWeek } from '../api';
import { formatKcal } from '../numbers';

// The short summary on the Profile overview, from what the app already logs (the same queries as Today
// and History): today, the last 7 days, and their exercise. The target above is the page's one big
// number, so these stay small. "On target" = a logged day where you ate no more than that day's budget.
// refreshOn: loads again when this changes (the saved profile: a new target changes the budgets).
function ProfileSummary({ refreshOn })
{
    const [data, setData] = useState(null); // { day, week } once loaded
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0); // "Try again" adds one, which loads again

    useEffect(() => {
        let isCurrent = true; // ignore an answer that arrives after the page has gone
        Promise.all([getDailyLog(null), getWeek(null)])
            .then(([day, week]) => { if (isCurrent) setData({ day, week }); })
            .catch((err) => { if (isCurrent) setError(err.message); });
        return () => { isCurrent = false; };
    }, [attempt, refreshOn]);

    const retry = () => {
        setError(null);
        setAttempt((n) => n + 1);
    };

    let content;
    if (error)
    {
        content = (
            <div className="summary-problem" role="alert">
                <p className="muted">Couldn't load your summary. {error}</p>
                <button type="button" className="btn" onClick={retry}>Try again</button>
            </div>
        );
    }
    else if (!data)
    {
        content = (
            <div className="summary-problem">
                <p className="muted loading" role="status">Loading your week…</p>
            </div>
        );
    }
    else
    {
        const { day, week } = data;
        const isOver = day.remainingKcal < 0;
        const onTarget = week.days.filter((d) => d.logged && d.eatenKcal <= d.budgetKcal).length;
        const burned = week.days.reduce((sum, d) => sum + d.burnedKcal, 0);
        const versus = week.averageBudgetKcal !== week.averageTargetKcal ? 'budget' : 'target';

        content = (
            <dl className="summary-stats num">
                <div className="summary-stat">
                    <dt>Today</dt>
                    <dd>
                        <span className="stat-value">{formatKcal(day.eatenKcal)} kcal eaten</span>
                        <span className={isOver ? 'stat-sub over' : 'stat-sub'}>
                            {isOver ? `${formatKcal(-day.remainingKcal)} over` : `${formatKcal(day.remainingKcal)} left`}
                        </span>
                    </dd>
                </div>
                <div className="summary-stat">
                    <dt>This week</dt>
                    {week.loggedDays === 0 ? (
                        <dd>
                            <span className="stat-value">Nothing logged</span>
                            <span className="stat-sub">in the last 7 days</span>
                        </dd>
                    ) : (
                        <dd>
                            <span className="stat-value">{formatKcal(week.averageKcal)} kcal a day</span>
                            <span className="stat-sub">
                                {versus} {formatKcal(week.averageBudgetKcal)} · {onTarget} of {week.loggedDays} {week.loggedDays === 1 ? 'day' : 'days'} on target
                            </span>
                        </dd>
                    )}
                </div>
                <div className="summary-stat">
                    <dt>Exercise</dt>
                    <dd>
                        <span className="stat-value">{formatKcal(burned)} kcal burned</span>
                        <span className="stat-sub">in the last 7 days</span>
                    </dd>
                </div>
            </dl>
        );
    }

    return (
        <section className="card profile-summary" aria-labelledby="summary-title">
            <h2 id="summary-title" className="visually-hidden">Your summary</h2>
            {content}
        </section>
    );
}

export default ProfileSummary;
