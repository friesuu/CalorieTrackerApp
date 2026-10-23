import { formatKcal } from '../numbers';

// The ring is drawn in a 120 × 120 box: a circle of radius 50 with a 13-wide stroke just fits inside
const RADIUS = 50;
const STROKE = 13;
const LENGTH = 2 * Math.PI * RADIUS; // the circle's length, about 314

// How much of the day's budget is eaten, as a ring, with what's left (or how far over) in the middle.
// The ring is drawn with one long dash: strokeDasharray makes the dash as long as the circle, and
// strokeDashoffset slides it back so only the eaten part shows. Full (and --over) once over.
// It draws itself in when it first appears (the ring-in animation in App.css), then slides to each new value.
// For screen readers it's a progressbar with the numbers in words (the drawing itself is hidden from them).
function ProgressRing({ eatenKcal, budgetKcal, remainingKcal })
{
    const isOver = remainingKcal < 0;
    const filled = Math.min(eatenKcal / budgetKcal, 1); // 0 to 1
    const offset = LENGTH * (1 - filled);

    return (
        <div
            className="ring"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={budgetKcal}
            aria-valuenow={Math.min(eatenKcal, budgetKcal)}
            aria-valuetext={`${formatKcal(eatenKcal)} of ${formatKcal(budgetKcal)} kcal eaten, ${isOver ? `${formatKcal(-remainingKcal)} over` : `${formatKcal(remainingKcal)} left`}`}
        >
            <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="ring-track" cx="60" cy="60" r={RADIUS} strokeWidth={STROKE} />
                <circle
                    className="ring-fill"
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    strokeWidth={STROKE}
                    // --ring-length: where the ring-in animation starts (empty)
                    // opacity 0 at nothing eaten: a round line end would still draw a dot
                    style={{ '--ring-length': LENGTH, strokeDasharray: LENGTH, strokeDashoffset: offset, opacity: filled > 0 ? 1 : 0 }}
                />
            </svg>
            <div className="ring-centre">
                <span className="ring-number num">{formatKcal(Math.abs(remainingKcal))}</span>
                <span className="ring-unit">{isOver ? 'kcal over' : 'kcal left'}</span>
            </div>
        </div>
    );
}

export default ProgressRing;
