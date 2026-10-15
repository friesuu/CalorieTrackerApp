import { formatAmount, formatKcal } from '../numbers';

// "45 g protein · 120 g carbs", only the ones the logged foods have. Empty when none do.
function macrosText(day)
{
    return [
        day.proteinG !== null && `${formatAmount(day.proteinG)} g protein`,
        day.carbsG !== null && `${formatAmount(day.carbsG)} g carbs`,
        day.fatG !== null && `${formatAmount(day.fatG)} g fat`,
    ].filter(Boolean).join(' · ');
}

// The top card on the daily log. The hero number is what's left (or how far over).
// Over target is said in words AND shown in colour, never colour alone.
function DaySummary({ day })
{
    const isOver = day.remainingKcal < 0;
    const filled = Math.min(day.eatenKcal / day.targetKcal, 1) * 100; // % of the bar, full once over
    const macros = macrosText(day);

    return (
        <section className={isOver ? 'card summary-card over' : 'card summary-card'} aria-label="Calories">
            <p className="card-label">{isOver ? 'Over target' : 'Remaining'}</p>
            <p className="hero-number num">
                {isOver ? `Over by ${formatKcal(-day.remainingKcal)}` : formatKcal(day.remainingKcal)}
                <span className="hero-unit"> kcal</span>
            </p>

            <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={day.targetKcal}
                aria-valuenow={Math.min(day.eatenKcal, day.targetKcal)}
                aria-valuetext={`${formatKcal(day.eatenKcal)} of ${formatKcal(day.targetKcal)} kcal eaten`}
            >
                <div className="progress-fill" style={{ width: `${filled}%` }} />
            </div>

            <p className="summary-totals num">
                <strong>{formatKcal(day.eatenKcal)}</strong> eaten / {formatKcal(day.targetKcal)} target
            </p>
            {macros && <p className="summary-macros">{macros}</p>}
        </section>
    );
}

export default DaySummary;
