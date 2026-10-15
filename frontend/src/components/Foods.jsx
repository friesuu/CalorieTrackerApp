import { useState } from 'react';
import FoodRow from './FoodRow';
import FoodForm from './FoodForm';
import Sheet from './Sheet';
import ConfirmButton from './ConfirmButton';
import { PlusIcon, ChevronRightIcon } from './Icons';
import { filterFoods } from '../foodSearch';

// The Foods page: search, the library A to Z, add, and tap a food to edit or delete it.
// foods comes from App (null while loading). Search only filters what's already loaded: no request per letter.
function Foods({ foods, loadError, onRetry, onCreate, onUpdate, onDelete })
{
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addName, setAddName] = useState(''); // "Add 'nasi lemak'" from an empty search fills the name in
    const [editing, setEditing] = useState(null); // the food being edited, or null

    const openAdd = (name = '') => {
        setAddName(name);
        setIsAdding(true);
    };

    // Each closes its sheet only once the save worked. If it throws, the form shows the error and stays open.
    const handleCreate = async (input) => {
        await onCreate(input);
        setIsAdding(false);
    };

    const handleUpdate = async (input) => {
        await onUpdate(editing.id, input);
        setEditing(null);
    };

    const handleDelete = async () => {
        await onDelete(editing.id);
        setEditing(null);
    };

    const shown = foods && filterFoods(foods, search);
    const query = search.trim();

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
                <p>No foods match “{query}”.</p>
                <button className="btn" onClick={() => openAdd(query)}>Add “{query}”</button>
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
                            {/* The whole row is the button: easy to hit on a phone. The arrow says "opens something". */}
                            <button className="row-button" onClick={() => setEditing(food)} aria-label={`Edit ${food.name}`}>
                                <FoodRow food={food} />
                                <span className="row-chevron"><ChevronRightIcon size={18} /></span>
                            </button>
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

            <Sheet title="Edit food" isOpen={editing !== null} onClose={() => setEditing(null)}>
                {editing && (
                    <div className="sheet-stack">
                        <FoodForm food={editing} submitLabel="Save changes" onSave={handleUpdate} />
                        <ConfirmButton
                            label="Delete food"
                            question={`Delete “${editing.name}” from your library? Days you've already logged it on keep their calories.`}
                            confirmLabel="Delete"
                            onConfirm={handleDelete}
                        />
                    </div>
                )}
            </Sheet>
        </>
    );
}

export default Foods;
