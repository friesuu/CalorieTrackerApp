import { Fragment, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import FoodRow from './FoodRow';
import { filterFoods } from '../foodSearch';

// The food list, with drag and drop (laptop: drag a food into the log). Tapping still works.
// Dragging COPIES a food into the log, so the library itself never changes:
//  - renderClone draws the moving copy (in <body>, so nothing can cut it off)
//  - a still copy stays in the list where the food was (the library hides the original while it's dragged)
function DraggableFoodList({ foods, onPick })
{
    return (
        <Droppable
            droppableId="library"
            isDropDisabled // nothing can be dropped INTO the library
            renderClone={(provided, snapshot, rubric) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="drag-clone">
                    <FoodRow food={foods[rubric.source.index]} />
                </div>
            )}
        >
            {(provided, snapshot) => (
                <ul className="picker-list drag-source" ref={provided.innerRef} {...provided.droppableProps} aria-label="Foods">
                    {foods.map((food, index) => (
                        <Fragment key={food.id}>
                            {snapshot.draggingFromThisWith === `library:${food.id}` && (
                                <li className="drag-copy" aria-hidden="true">
                                    <div className="row-button"><FoodRow food={food} /></div>
                                </li>
                            )}
                            {/* disableInteractiveElementBlocking: the drag handle IS a button (so tapping still adds).
                                Without it, the library refuses to start a drag on a button. */}
                            <Draggable draggableId={`library:${food.id}`} index={index} disableInteractiveElementBlocking>
                                {(drag) => (
                                    <li ref={drag.innerRef} {...drag.draggableProps}>
                                        <button className="row-button" {...drag.dragHandleProps} onClick={() => onPick(food)} aria-label={`Add ${food.name}`}>
                                            <FoodRow food={food} />
                                        </button>
                                    </li>
                                )}
                            </Draggable>
                        </Fragment>
                    ))}
                    {provided.placeholder}
                </ul>
            )}
        </Droppable>
    );
}

// Search the library and pick a food. In a sheet on phones, beside the log on laptops (draggable there).
// No match? It offers a quick add with what you typed, so you're never stuck.
function FoodPicker({ foods, loadError, onRetry, onPick, onQuickAdd, draggable = false })
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
    else if (draggable)
    {
        content = <DraggableFoodList foods={shown} onPick={onPick} />;
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
            {draggable && shown?.length > 0 && <p className="field-hint">Tap a food to add it, or drag it into your log.</p>}
            {content}
        </div>
    );
}

export default FoodPicker;
