import { formatKcal } from '../numbers';

// The foods you log most often, as chips you can tap (one tap away instead of searching).
// Hidden until you've logged something from the library.
function RecentFoods({ foods, onPick })
{
    if (!foods || foods.length === 0) return null;

    return (
        <section className="recent" aria-labelledby="recent-title">
            <h2 id="recent-title" className="list-meta">Recent</h2>
            {/* Scrolls sideways on a phone instead of wrapping onto many lines */}
            <ul className="chips">
                {foods.map((food) => (
                    <li key={food.id}>
                        <button className="chip" onClick={() => onPick(food)} aria-label={`Add ${food.name}`}>
                            {food.name}
                            <span className="chip-kcal num">{formatKcal(food.kcalPerServing)}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default RecentFoods;
