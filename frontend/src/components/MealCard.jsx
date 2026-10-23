import { Droppable } from '@hello-pangea/dnd';
import { formatKcal } from '../numbers';
import { mealLabel, mealProgress } from '../meals';
import { ChevronRightIcon } from './Icons';
import MealIcon from './MealIcon';

// One meal on the Today overview: eaten / target, a bar, what's in it, and what's left (or how far over).
// Tap it to open the meal. It's also a drop zone: drop a food on it to add it to this meal.
// summary: { meal, targetKcal, eatenKcal, entries } from the API
function MealCard({ summary, isDragging, onOpen })
{
    const { remaining, isOver, filled } = mealProgress(summary);
    const names = summary.entries.map((entry) => entry.name).join(', ');

    return (
        <Droppable droppableId={`meal:${summary.meal}`}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`drop-zone${isDragging ? ' ready' : ''}${snapshot.isDraggingOver ? ' active' : ''}`}
                >
                    {/* The id lets Today put focus back here when you come back from the meal */}
                    <button id={`meal-card-${summary.meal}`} className="card meal-card" onClick={onOpen}>
                        <span className="meal-card-head">
                            <MealIcon meal={summary.meal} />
                            <span className="meal-name">{mealLabel(summary.meal)}</span>
                            <span className="meal-kcal num">
                                <strong>{formatKcal(summary.eatenKcal)}</strong> / {formatKcal(summary.targetKcal)} kcal
                            </span>
                            <span className="meal-chevron"><ChevronRightIcon size={18} /></span>
                        </span>
                        {/* The numbers are in the text, so the bar is only for the eye */}
                        <span className="meter" aria-hidden="true">
                            <span className={isOver ? 'meter-fill over' : 'meter-fill'} style={{ width: `${filled}%` }} />
                        </span>
                        <span className="meal-card-foot">
                            <span className="meal-items">{names || 'Nothing yet'}</span>
                            {/* A pill: rose when over, grey otherwise. The words say which, too. */}
                            <span className={isOver ? 'meal-status pill pill-danger num' : 'meal-status pill num'}>
                                {isOver ? `${formatKcal(-remaining)} over` : `${formatKcal(remaining)} left`}
                            </span>
                        </span>
                    </button>
                    {/* The drag library makes room for the dropped item here. Hidden: a dropped food opens
                        the add sheet instead, so the cards shouldn't grow and jump while you drag over them. */}
                    <div className="drop-placeholder">{provided.placeholder}</div>
                </div>
            )}
        </Droppable>
    );
}

export default MealCard;
