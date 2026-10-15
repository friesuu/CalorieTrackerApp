import { useState } from 'react';
import FoodRow from './FoodRow';
import { filterFoods } from '../foodSearch';

// Search the library and pick a food. In a sheet on phones, beside the log on laptops.
// No match? It offers a quick add with what you typed, so you're never stuck.
function FoodPicker({ foods, loadError, onRetry, onPick, onQuickAdd })
{
    const [search, setSearch] = useState('');
    const query = search.trim();
    const shown = foods && filterFoods(foods, search);

    let content;
    if (loadError)
    {
        content = (
            <div className="empty-state" role="alert">
                <p>Couldn't load your foods.</p>
                <button className="btn" onClick={onRetry}>Try again</button>
            </div>
        );
    }
    else if (foods === null)
    {
        content = <p className="muted picker-message" role="status">Loading your foods…</p>;
    }
    else if (foods.length === 0)
    {
        content = (
            <div className="empty-state">
                <p className="muted">Your food library is empty. Add foods on the Foods page, or use quick add.</p>
                <button className="btn" onClick={() => onQuickAdd('')}>Quick add</button>
            </div>
        );
    }
    else if (shown.length === 0)
    {
        content = (
            <div className="empty-state">
                <p>No foods match “{query}”.</p>
                <button className="btn" onClick={() => onQuickAdd(query)}>Quick add “{query}”</button>
            </div>
        );
    }
    else
    {
        content = (
            <ul className="picker-list" aria-label="Foods">
                {shown.map((food) => (
                    <li key={food.id}>
                        <button className="row-button" onClick={() => onPick(food)} aria-label={`Add ${food.name}`}>
                            <FoodRow food={food} />
                        </button>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="picker">
            <div className="field picker-search">
                <label htmlFor="picker-search" className="field-label">Search your foods</label>
                <input
                    id="picker-search"
                    type="search"
                    className="input"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            {content}
        </div>
    );
}

export default FoodPicker;
