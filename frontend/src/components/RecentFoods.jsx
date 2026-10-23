import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { formatKcal } from '../numbers';
import { useMediaQuery } from '../useMediaQuery';
import { TABLET_UP } from '../breakpoints';

// One short row: only your latest few, so it never needs a second line
const MAX_SHOWN = 4;

// What a chip shows: the name, and its calories (muted)
function ChipContent({ food })
{
    return (
        <>
            <span className="chip-name">{food.name}</span>
            <span className="chip-kcal num">{formatKcal(food.kcalPerServing)}</span>
        </>
    );
}

// From 720px the row shows only the chips that fit whole, so no name is cut off. The others are hidden
// (visibility: hidden, so they can't be tabbed to or read out, but keep their place), which lets them be
// measured again when the row gets wider. The ResizeObserver measures once when it starts, then whenever the
// row or a chip changes size (a chip changes when the font finishes loading, even if the row doesn't).
// (On a phone the row scrolls sideways instead, so all of them stay.)
function useChipsThatFit(listRef, key)
{
    const [fitCount, setFitCount] = useState(MAX_SHOWN);

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return undefined;
        const chips = [...list.children].filter((child) => child.dataset.chip !== undefined);

        const observer = new ResizeObserver(() => {
            const edge = list.getBoundingClientRect().right - parseFloat(getComputedStyle(list).paddingRight);
            const fits = chips.filter((chip) => chip.getBoundingClientRect().right <= edge + 1).length;
            setFitCount(Math.max(fits, 1)); // always the latest one (cut off with … only if it's wider than the row)
        });
        observer.observe(list);
        chips.forEach((chip) => observer.observe(chip));
        return () => observer.disconnect();
    }, [listRef, key]);

    return fitCount;
}

// The foods you logged most recently (up to 4), as chips in one row. Tap one to add it, or (on a phone too)
// press, hold and drag it onto a meal. Works the same way as the library list: see DraggableFoodList in FoodPicker.jsx.
// Hidden until you've logged something from the library.
function RecentFoods({ foods, onPick })
{
    const listRef = useRef(null);
    const isWide = useMediaQuery(TABLET_UP);
    const shown = (foods ?? []).slice(0, MAX_SHOWN);
    const fitCount = useChipsThatFit(listRef, shown.map((food) => food.id).join() + isWide);
    const visibleCount = isWide ? fitCount : MAX_SHOWN;

    if (shown.length === 0) return null;

    return (
        <section className="recent" aria-labelledby="recent-title">
            <h2 id="recent-title" className="section-head">Recent</h2>
            <Droppable
                droppableId="recent"
                direction="horizontal"
                isDropDisabled
                renderClone={(provided, snapshot, rubric) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="chip chip-add drag-clone">
                        <ChipContent food={shown[rubric.source.index]} />
                    </div>
                )}
            >
                {(provided, snapshot) => (
                    // One row: scrolls sideways on a phone, shows the chips that fit from 720px
                    <ul
                        className="chips drag-source"
                        ref={(element) => { provided.innerRef(element); listRef.current = element; }}
                        {...provided.droppableProps}
                    >
                        {shown.map((food, index) => (
                            <Fragment key={food.id}>
                                {snapshot.draggingFromThisWith === `recent:${food.id}` && (
                                    <li className="drag-copy" aria-hidden="true">
                                        <span className="chip chip-add"><ChipContent food={food} /></span>
                                    </li>
                                )}
                                <Draggable draggableId={`recent:${food.id}`} index={index} disableInteractiveElementBlocking>
                                    {(drag) => (
                                        <li
                                            ref={drag.innerRef}
                                            {...drag.draggableProps}
                                            data-chip=""
                                            className={index >= visibleCount ? 'chip-hidden' : undefined}
                                        >
                                            <button className="chip chip-add" {...drag.dragHandleProps} onClick={() => onPick(food)} aria-label={`Add ${food.name}`} title={food.name}>
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
