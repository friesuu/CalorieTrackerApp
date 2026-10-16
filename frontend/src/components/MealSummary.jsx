import { formatKcal } from '../numbers';
import { mealLabel, mealProgress, mealWord } from '../meals';

// The top card inside a meal, like the day's summary card: what's left of this meal's share of the day.
// Over its share is said in words AND shown in colour, never colour alone.
function MealSummary({ summary, dayTargetKcal })
{
    const { remaining, isOver, filled } = mealProgress(summary);
    // The meal's share of the day, e.g. 540 of 2,161 = 25%. (Rounding only ever moves a meal by a kcal or two.)
    const share = Math.round((summary.targetKcal / dayTargetKcal) * 100);

    return (
        <section className={isOver ? 'card summary-card over' : 'card summary-card'} aria-label={`${mealLabel(summary.meal)} calories`}>
            <p className="card-label">{isOver ? "Over this meal's share" : 'Remaining'}</p>
            <p className="hero-number num">
                {isOver ? `Over by ${formatKcal(-remaining)}` : formatKcal(remaining)}
                <span className="hero-unit"> kcal</span>
            </p>

            <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={summary.targetKcal}
                aria-valuenow={Math.min(summary.eatenKcal, summary.targetKcal)}
                aria-valuetext={`${formatKcal(summary.eatenKcal)} of ${formatKcal(summary.targetKcal)} kcal eaten`}
            >
                <div className="progress-fill" style={{ width: `${filled}%` }} />
            </div>

            <p className="summary-totals num">
                <strong>{formatKcal(summary.eatenKcal)}</strong> eaten / {formatKcal(summary.targetKcal)} for {mealWord(summary.meal)}
            </p>
            <p className="summary-macros">
                {share}% of the day's {formatKcal(dayTargetKcal)} kcal. You can change the split on your Profile.
            </p>
        </section>
    );
}

export default MealSummary;
