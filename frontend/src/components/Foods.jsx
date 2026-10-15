import { useState } from 'react';
import FoodRow from './FoodRow';
import FoodForm from './FoodForm';
import Sheet from './Sheet';
import { PlusIcon } from './Icons';

// The Foods page: search, the library A to Z, and Add food.
// foods comes from App (null while loading). Search only filters what's already loaded: no request per letter.
function Foods({ foods, loadError, onRetry, onCreate })
{
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addName, setAddName] = useState(''); // "Add 'nasi lemak'" from an empty search fills the name in

    const openAdd = (name = '') => {
        setAddName(name);
        setIsAdding(true);
    };

    // Close the sheet only once the save worked. If it throws, FoodForm shows the error and stays open.
    const handleCreate = async (input) => {
        await onCreate(input);
        setIsAdding(false);
    };

    const query = search.trim().toLowerCase();
    const shown = foods && query ? foods.filter((f) => f.name.toLowerCase().includes(query)) : foods;

    // Which list state to show. Loading, failed and empty all get their own message, not a blank card.
    let content;
    if (loadError)
    {
        content = (
            <section className="card empty-state" role="alert">
                <p>Couldn't load your foods.</p>
                <p className="muted">{loadError}</p>
                <button className="btn" onClick={onRetry}>Try again</button>
            </section>
        );
    }
    else if (foods === null)
    {
        content = <p className="muted" role="status">Loading your foods…</p>;
    }
    else if (foods.length === 0)
    {
        content = (
            <section className="card empty-state">
                <p><strong>Your food library is empty</strong></p>
                <p className="muted">Add the foods you eat often, so logging them takes one tap.</p>
                <button className="btn btn-primary" onClick={() => openAdd()}>Add your first food</button>
            </section>
        );
    }
    else if (shown.length === 0)
    {
        content = (
            <section className="card empty-state">
                <p>No foods match “{search.trim()}”.</p>
                <button className="btn" onClick={() => openAdd(search.trim())}>Add “{search.trim()}”</button>
            </section>
        );
    }
    else
    {
        content = (
            <>
                <p className="list-meta" aria-live="polite">
                    {query ? `${shown.length} of ${foods.length} foods` : `${foods.length} foods`}
                </p>
                <ul className="card list-card" aria-label="Your foods">
                    {shown.map((food) => (
                        <li key={food.id}>
                            <FoodRow food={food} />
                        </li>
                    ))}
                </ul>
            </>
        );
    }

    return(
        <>
            <div className="toolbar">
                <div className="field toolbar-search">
                    <label htmlFor="food-search" className="field-label">Search your foods</label>
                    <input
                        id="food-search"
                        type="search"
                        className="input"
                        autoComplete="off"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => openAdd()}>
                    <PlusIcon />
                    Add food
                </button>
            </div>

            {content}

            <Sheet title="Add food" isOpen={isAdding} onClose={() => setIsAdding(false)}>
                <FoodForm initialName={addName} submitLabel="Add food" onSave={handleCreate} />
            </Sheet>
        </>
    );
}

export default Foods;
