import { formatKcal } from '../numbers';
import { ChevronRightIcon, FlameIcon, PlusIcon } from './Icons';

// The day's exercise under the meals: one row each (tap to change or remove), and a button to log more.
// It's for the whole day, so it isn't in any meal.
function ExerciseSection({ day, onAdd, onEdit })
{
    const count = day.exercises.length;

    return (
        <section className="day-log" aria-labelledby="exercise-title">
            <h2 id="exercise-title" className="section-head">
                Exercise {count > 0 && <span className="pill pill-success num">{formatKcal(day.burnedKcal)} kcal burned</span>}
            </h2>
            {count > 0 && (
                <ul className="card list-card">
                    {day.exercises.map((exercise) => (
                        <li key={exercise.id}>
                            <button className="row-button" onClick={() => onEdit(exercise)} aria-label={`Edit ${exercise.name}`}>
                                {/* Same columns as a food: name | how long | calories */}
                                <span className="food-row with-icon">
                                    <span className="icon-circle exercise" aria-hidden="true"><FlameIcon /></span>
                                    <span className="food-name">{exercise.name}</span>
                                    <span className="food-serving">{exercise.minutes ? `${exercise.minutes} min` : ''}</span>
                                    <span className="food-kcal num">{formatKcal(exercise.kcal)} kcal</span>
                                </span>
                                <span className="row-chevron"><ChevronRightIcon size={18} /></span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button className="btn btn-tint-success exercise-add" onClick={onAdd}>
                <PlusIcon />
                Log exercise
            </button>
        </section>
    );
}

export default ExerciseSection;
