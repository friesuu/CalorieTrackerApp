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
// With exercise, a line shows exactly how "remaining" was worked out, so the number is never a mystery.
// isToday: only today follows the Profile setting; a past day keeps the one it had.
function DaySummary({ day, isToday })
{
    const isOver = day.remainingKcal < 0;
    // The budget is the target, plus exercise when the day adds it (worked out by the server)
    const addsExercise = day.budgetKcal !== day.targetKcal;
    const filled = Math.min(day.eatenKcal / day.budgetKcal, 1) * 100; // % of the bar, full once over
    const macros = macrosText(day);

    return (
        <section className={isOver ? 'card summary-card over' : 'card summary-card'} aria-label="Calories">
            <p className="card-label">{isOver ? `Over ${addsExercise ? 'budget' : 'target'}` : 'Remaining'}</p>
            <p className="hero-number num">
                {isOver ? `Over by ${formatKcal(-day.remainingKcal)}` : formatKcal(day.remainingKcal)}
                <span className="hero-unit"> kcal</span>
            </p>

            <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={day.budgetKcal}
                aria-valuenow={Math.min(day.eatenKcal, day.budgetKcal)}
                aria-valuetext={`${formatKcal(day.eatenKcal)} of ${formatKcal(day.budgetKcal)} kcal eaten`}
            >
                <div className="progress-fill" style={{ width: `${filled}%` }} />
            </div>

            <p className="summary-totals num">
                <strong>{formatKcal(day.eatenKcal)}</strong> eaten / {formatKcal(day.budgetKcal)} {addsExercise ? 'budget' : 'target'}
            </p>

            {day.burnedKcal > 0 && (
                <p className="summary-formula num">
                    {addsExercise
                        ? `${formatKcal(day.targetKcal)} target + ${formatKcal(day.burnedKcal)} exercise − ${formatKcal(day.eatenKcal)} eaten = ${formatKcal(Math.abs(day.remainingKcal))} ${isOver ? 'over' : 'left'}`
                        : isToday
                            ? `${formatKcal(day.burnedKcal)} kcal burned in exercise. It isn't added to your budget: you can change that on your Profile.`
                            : `${formatKcal(day.burnedKcal)} kcal burned in exercise. It wasn't added to this day's budget (the setting was off then).`}
                </p>
            )}
            {macros && <p className="summary-macros">{macros}</p>}
        </section>
    );
}

export default DaySummary;
