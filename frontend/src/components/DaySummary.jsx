import { formatAmount, formatKcal } from '../numbers';
import ProgressRing from './ProgressRing';

// "45 g protein · 120 g carbs", only the ones the logged foods have. Empty when none do.
function macrosText(day)
{
    return [
        day.proteinG !== null && `${formatAmount(day.proteinG)} g protein`,
        day.carbsG !== null && `${formatAmount(day.carbsG)} g carbs`,
        day.fatG !== null && `${formatAmount(day.fatG)} g fat`,
    ].filter(Boolean).join(' · ');
}

// The top card on the daily log: the ring (what's left, or how far over, in the middle), then eaten and
// left (or over) under it as two tinted tiles with kcal and % of the budget. Everything is centred in one
// column. Over is said in words AND shown in colour, never colour alone.
// With exercise, a line shows exactly how "remaining" was worked out, so the number is never a mystery.
// isToday: only today follows the Profile setting; a past day keeps the one it had.
function DaySummary({ day, isToday })
{
    const isOver = day.remainingKcal < 0;
    // The budget is the target, plus exercise when the day adds it (worked out by the server)
    const addsExercise = day.budgetKcal !== day.targetKcal;
    // Left's % is 100 − eaten's, so the two always add up to 100. Over: eaten is past 100, and over is the extra.
    const eatenPct = Math.round((day.eatenKcal / day.budgetKcal) * 100);
    const macros = macrosText(day);

    return (
        <section className={isOver ? 'card summary-card hero-card ring-card over' : 'card summary-card hero-card ring-card'} aria-label="Calories">
            <ProgressRing eatenKcal={day.eatenKcal} budgetKcal={day.budgetKcal} remainingKcal={day.remainingKcal} />

            {/* Eaten in periwinkle (the ring's colour); Left in mint, or Over in rose */}
            <dl className="ring-stats num">
                <div className="ring-stat eaten">
                    <dt>Eaten</dt>
                    <dd>{formatKcal(day.eatenKcal)} kcal <span className="ring-pct">({eatenPct}%)</span></dd>
                </div>
                <div className={isOver ? 'ring-stat over' : 'ring-stat left'}>
                    <dt>{isOver ? 'Over' : 'Left'}</dt>
                    <dd>
                        {formatKcal(Math.abs(day.remainingKcal))} kcal{' '}
                        <span className="ring-pct">({isOver ? eatenPct - 100 : 100 - eatenPct}%)</span>
                    </dd>
                </div>
            </dl>
            <p className="ring-budget num">
                {addsExercise ? 'Budget' : 'Daily target'} {formatKcal(day.budgetKcal)} kcal
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
