import { Fragment } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { formatKcal } from '../numbers';

// What a chip shows: the name, and its calories (muted)
function ChipContent({ food })
{
    return (
        <>
            {food.name}
            <span className="chip-kcal num">{formatKcal(food.kcalPerServing)}</span>
        </>
    );
}

// The foods you log most often, as chips. Tap one to add it, or (on a phone too) press, hold and drag it
// onto a meal. Works the same way as the library list: see DraggableFoodList in FoodPicker.jsx.
// Hidden until you've logged something from the library.
function RecentFoods({ foods, onPick })
{
    if (!foods || foods.length === 0) return null;

    return (
        <section className="recent" aria-labelledby="recent-title">
            <h2 id="recent-title" className="list-meta">Recent</h2>
            <Droppable
                droppableId="recent"
                direction="horizontal"
                isDropDisabled
                renderClone={(provided, snapshot, rubric) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="chip drag-clone">
                        <ChipContent food={foods[rubric.source.index]} />
                    </div>
                )}
            >
                {(provided, snapshot) => (
                    // Scrolls sideways on a phone instead of wrapping onto many lines
                    <ul className="chips drag-source" ref={provided.innerRef} {...provided.droppableProps}>
                        {foods.map((food, index) => (
                            <Fragment key={food.id}>
                                {snapshot.draggingFromThisWith === `recent:${food.id}` && (
                                    <li className="drag-copy" aria-hidden="true">
                                        <span className="chip"><ChipContent food={food} /></span>
                                    </li>
                                )}
                                <Draggable draggableId={`recent:${food.id}`} index={index} disableInteractiveElementBlocking>
                                    {(drag) => (
                                        <li ref={drag.innerRef} {...drag.draggableProps}>
                                            <button className="chip" {...drag.dragHandleProps} onClick={() => onPick(food)} aria-label={`Add ${food.name}`}>
                                                <ChipContent food={food} />
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
        </section>
    );
}

export default RecentFoods;
