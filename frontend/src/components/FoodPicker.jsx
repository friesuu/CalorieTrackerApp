import { Fragment, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import FoodRow from './FoodRow';
import { filterFoods } from '../foodSearch';
import { AlertIcon, FoodsIcon, SearchIcon } from './Icons';

// The food list, with drag and drop (laptop: drag a food onto a meal). Tapping still works.
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
                    <FoodRow food={foods[rubric.source.index]} stacked />
                </div>
            )}
        >
            {(provided, snapshot) => (
                <ul className="picker-list drag-source" ref={provided.innerRef} {...provided.droppableProps} aria-label="Foods">
                    {foods.map((food, index) => (
                        <Fragment key={food.id}>
                            {snapshot.draggingFromThisWith === `library:${food.id}` && (
                                <li className="drag-copy" aria-hidden="true">
                                    <div className="row-button"><FoodRow food={food} stacked /></div>
                                </li>
                            )}
                            {/* disableInteractiveElementBlocking: the drag handle IS a button (so tapping still adds).
                                Without it, the library refuses to start a drag on a button. */}
                            <Draggable draggableId={`library:${food.id}`} index={index} disableInteractiveElementBlocking>
                                {(drag) => (
                                    <li ref={drag.innerRef} {...drag.draggableProps}>
                                        <button className="row-button" {...drag.dragHandleProps} onClick={() => onPick(food)} aria-label={`Add ${food.name}`}>
                                            <FoodRow food={food} stacked />
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
// title / titleId (the library beside the day): a heading on the same row as the search box, to its left
function FoodPicker({ foods, loadError, onRetry, onPick, onQuickAdd, draggable = false, title = null, titleId })
{
    const [search, setSearch] = useState('');
    const query = search.trim();
    const shown = foods && filterFoods(foods, search);

    let content;
    if (loadError)
    {
        content = (
            <div className="empty-state" role="alert">
                <span className="empty-icon" aria-hidden="true"><AlertIcon /></span>
                <p className="empty-title">Couldn't load your foods.</p>
                <button className="btn btn-primary" onClick={onRetry}>Try again</button>
            </div>
        );
    }
    else if (foods === null)
    {
        content = <p className="muted picker-message loading" role="status">Loading your foods…</p>;
    }
    else if (foods.length === 0)
    {
        content = (
            <div className="empty-state">
                <span className="empty-icon" aria-hidden="true"><FoodsIcon size={20} /></span>
                <p className="empty-title">Your food library is empty</p>
                <p className="muted">Add foods on the Foods page, or use quick add.</p>
                <button className="btn btn-primary" onClick={() => onQuickAdd('')}>Quick add</button>
            </div>
        );
    }
    else if (shown.length === 0)
    {
        content = (
            <div className="empty-state">
                <span className="empty-icon" aria-hidden="true"><FoodsIcon size={20} /></span>
                <p className="empty-title">No foods match “{query}”.</p>
                <button className="btn btn-primary" onClick={() => onQuickAdd(query)}>Quick add “{query}”</button>
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

    const searchInput = (
        <input
            id="picker-search"
            type="search"
            className="input"
            autoComplete="off"
            placeholder={draggable ? 'Search foods' : undefined}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
    );

    const searchField = (
        <div className="field picker-search">
            {/* The library (draggable) keeps its header calm: the label is only read out to screen readers,
                and a search icon inside the box says what it's for */}
            <label htmlFor="picker-search" className={draggable ? 'visually-hidden' : 'field-label'}>Search your foods</label>
            {draggable ? (
                <span className="search-input">
                    <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
                    {searchInput}
                </span>
            ) : searchInput}
        </div>
    );

    return (
        <div className="picker">
            {title ? (
                <div className="picker-head">
                    <h2 id={titleId} className="card-label">{title}</h2>
                    {searchField}
                </div>
            ) : searchField}
            {draggable && shown?.length > 0 && <p className="field-hint">Tap or drag onto a meal</p>}
            {content}
        </div>
    );
}

export default FoodPicker;
