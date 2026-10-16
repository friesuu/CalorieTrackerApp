import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { getDailyLog, getRecentFoods, addLogEntry, quickAdd, updateLogEntry, deleteLogEntry } from '../api';
import { addDays, dayLabel, longDate, shortDate } from '../dates';
import { useMediaQuery } from '../useMediaQuery';
import { useNewDay } from '../useNewDay';
import { entryToAddTo, entryToMoveTo } from '../logMatching';
import { mealLabel, mealWord } from '../meals';
import DaySummary from './DaySummary';
import MealCard from './MealCard';
import MealSummary from './MealSummary';
import EntryList from './EntryList';
import QuantityForm from './QuantityForm';
import QuickAddForm from './QuickAddForm';
import FoodPicker from './FoodPicker';
import RecentFoods from './RecentFoods';
import Sheet from './Sheet';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './Icons';

// Removing an entry needs no "are you sure?": it's one item, and easy to add again
function RemoveButton({ onRemove })
{
    const [error, setError] = useState(null);
    const [isWorking, setIsWorking] = useState(false);

    const handleClick = async () => {
        setError(null);
        setIsWorking(true);
        try
        {
            await onRemove();
        }
        catch (err)
        {
            setError(err.message);
            setIsWorking(false);
        }
    };

    return (
        <>
            {error && <p className="form-error" role="alert">Couldn't remove: {error}</p>}
            <button type="button" className="btn btn-danger btn-block" onClick={handleClick} disabled={isWorking}>
                {isWorking ? 'Removing…' : 'Remove from log'}
            </button>
        </>
    );
}

// The daily log: what's left today, the four meals, and adding more. Tap a meal to open it.
// Its data (the day) lives here, not in App: no other page needs it.
// foods (the library) comes from App, because the Foods page uses the same list.
// initialDate / initialToday: set when a day is opened from the History page
function Today({ foods, foodsError, onRetryFoods, initialDate = null, initialToday = null })
{
    const isLaptop = useMediaQuery('(min-width: 1024px)'); // laptop: the library sits beside the log
    // null = today (the server says which day that is)
    const [selectedDate, setSelectedDate] = useState(initialDate && initialDate !== initialToday ? initialDate : null);
    const [today, setToday] = useState(initialToday); // 'YYYY-MM-DD', learnt from the first load of today
    const [day, setDay] = useState(null); // the day on screen; null while loading
    const [loadError, setLoadError] = useState(null);
    const [recent, setRecent] = useState(null);
    // The meal that's open ('BREAKFAST' ...), or null for the overview of the day
    const [openMeal, setOpenMeal] = useState(null);
    // Which sheet is open: { type: 'pick' | 'add' | 'edit' | 'quick', ... } or null
    const [sheet, setSheet] = useState(null);
    const [isDragging, setIsDragging] = useState(false); // a food is being dragged: show where to drop it

    // useCallback: the same function until the day changes, so the effects below only re-run then
    const loadDay = useCallback(() => {
        getDailyLog(selectedDate)
            .then((loaded) => {
                setDay(loaded);
                if (selectedDate === null) setToday(loaded.date);
            })
            .catch((err) => setLoadError(err.message));
    }, [selectedDate]);

    useEffect(() => {
        loadDay();
    }, [loadDay]);

    // Recent foods are only a shortcut: if they can't load, the row just doesn't show
    const loadRecent = () => getRecentFoods().then(setRecent).catch(() => setRecent([]));
    useEffect(() => {
        loadRecent();
    }, []);

    // A new day starts at midnight: while showing today, reload when the day may have changed,
    // so after midnight it shows the new, empty day. Past days are kept, never wiped.
    useNewDay(loadDay, selectedDate === null);

    // Opening a meal is like going to a new page: focus moves to its title, so a screen reader says where you are.
    // Coming back puts focus on the meal's card again, so you don't lose your place.
    const mealTitleRef = useRef(null);
    const lastOpenMeal = useRef(null);
    useEffect(() => {
        if (openMeal)
        {
            window.scrollTo(0, 0); // starts at the top, like a new page, with the back button in view
            mealTitleRef.current?.focus({ preventScroll: true });
            lastOpenMeal.current = openMeal;
        }
        else if (lastOpenMeal.current)
        {
            document.getElementById(`meal-card-${lastOpenMeal.current}`)?.focus();
            lastOpenMeal.current = null;
        }
    }, [openMeal]);

    const goToDate = (date) => {
        setDay(null); // shows "Loading…" instead of the old day's numbers
        setLoadError(null);
        setSheet(null);
        setOpenMeal(null);
        setSelectedDate(date === today ? null : date);
    };

    const retry = () => {
        setLoadError(null);
        loadDay();
    };

    // Every change sends back the whole day, so the screen always shows the server's own totals.
    // If the request fails, the error goes up to the form in the sheet, which shows it and stays open.
    const applyChange = async (request) => {
        const updated = await request;
        setDay(updated);
        setSheet(null);
    };

    // Logged on the day on screen (day.date), even if midnight passes while the sheet is open
    const handleAdd = async (food, quantity, meal) => {
        await applyChange(addLogEntry({ foodId: food.id, quantity, meal, date: day.date }));
        loadRecent(); // this food is now the most recent
    };
    const handleQuickAdd = (input) => applyChange(quickAdd({ ...input, date: day.date }));
    const handleRemoveEntry = (entry) => applyChange(deleteLogEntry(entry.id));

    // Only what changed is sent. Nothing changed: just close the sheet.
    const handleUpdateEntry = async (entry, quantity, meal) => {
        const changes = {};
        if (quantity !== entry.quantity) changes.quantity = quantity;
        if (meal !== null && meal !== entry.meal) changes.meal = meal;
        if (Object.keys(changes).length === 0) setSheet(null);
        else await applyChange(updateLogEntry(entry.id, changes));
    };

    // Picked inside a meal: it goes in that meal. Picked on the overview: the sheet asks which meal (meal = null).
    const pickFood = (food, meal = openMeal) => setSheet({ type: 'add', food, meal });
    const openQuickAdd = (name) => setSheet({ type: 'quick', name, meal: openMeal });

    // Dropped on a meal: open "how many servings?" for that food in that meal, the same as tapping it there.
    // Draggable ids are 'library:12' or 'recent:12' (the food's id); meal drop zones are 'meal:LUNCH'.
    const handleDragEnd = ({ destination, draggableId }) => {
        setIsDragging(false);
        const [zone, meal] = (destination?.droppableId ?? '').split(':');
        if (zone !== 'meal') return; // dropped somewhere else, or Esc pressed

        const id = Number(draggableId.split(':')[1]);
        const food = foods?.find((f) => f.id === id) ?? recent?.find((f) => f.id === id);
        if (food && day) pickFood(food, meal);
    };

    const label = day && today ? dayLabel(day.date, today) : 'Today';
    const isToday = selectedDate === null;
    const isNearDay = label === 'Today' || label === 'Yesterday';
    const dayWord = isNearDay ? label.toLowerCase() : label; // "today", "yesterday", "Tue 13 Oct"
    const onDay = isNearDay ? dayWord : `on ${label}`;
    // "Add to lunch" today; the day as well on any other day, so nothing is logged on the wrong day by mistake
    const addLabelFor = (meal) => {
        if (meal === null) return `Add to ${dayWord}`;
        return isToday ? `Add to ${mealWord(meal)}` : `Add to ${mealWord(meal)}, ${dayWord}`;
    };

    // What's in the sheet depends on what was tapped
    let sheetTitle = '';
    let sheetContent = null;
    if (sheet?.type === 'pick')
    {
        sheetTitle = openMeal ? `Add to ${mealWord(openMeal)}` : 'Add food';
        sheetContent = (
            <FoodPicker foods={foods} loadError={foodsError} onRetry={onRetryFoods} onPick={pickFood} onQuickAdd={openQuickAdd} />
        );
    }
    else if (sheet?.type === 'add')
    {
        sheetTitle = 'Add food';
        sheetContent = (
            <QuantityForm
                item={sheet.food}
                meal={sheet.meal}
                chooseMeal={sheet.meal === null}
                submitLabel={addLabelFor}
                onSave={(q, meal) => handleAdd(sheet.food, q, meal)}
                // Already in that meal? The sheet says so, and shows the total it will become
                findMerge={(meal, q) => entryToAddTo(day.entries, sheet.food, meal, q)}
                onDay={onDay}
            />
        );
    }
    else if (sheet?.type === 'edit')
    {
        sheetTitle = 'Edit entry';
        sheetContent = (
            <div className="sheet-stack">
                <QuantityForm
                    item={sheet.entry}
                    initialQuantity={sheet.entry.quantity}
                    meal={sheet.entry.meal}
                    chooseMeal
                    editing
                    submitLabel="Save"
                    onSave={(q, meal) => handleUpdateEntry(sheet.entry, q, meal)}
                    findMerge={(meal, q) => entryToMoveTo(day.entries, sheet.entry, meal, q)}
                />
                <RemoveButton onRemove={() => handleRemoveEntry(sheet.entry)} />
            </div>
        );
    }
    else if (sheet?.type === 'quick')
    {
        sheetTitle = 'Quick add';
        sheetContent = (
            <QuickAddForm
                initialName={sheet.name}
                meal={sheet.meal}
                chooseMeal={sheet.meal === null}
                submitLabel={addLabelFor}
                onSave={handleQuickAdd}
            />
        );
    }

    const editEntry = (entry) => setSheet({ type: 'edit', entry });

    // Add food (phones: on a laptop the library is already on screen, beside the log) and quick add
    const actions = (
        <div className="day-actions">
            {!isLaptop && (
                <button className="btn btn-primary" onClick={() => setSheet({ type: 'pick' })}>
                    <PlusIcon />
                    Add food
                </button>
            )}
            <button className="btn" onClick={() => openQuickAdd('')}>Quick add</button>
        </div>
    );

    let header;
    let content;
    if (day && openMeal)
    {
        // ---------- One meal: its share of the day, and what's in it ----------
        const summary = day.meals.find((m) => m.meal === openMeal);
        const count = summary.entries.length;

        header = (
            <header className="page-header meal-header">
                <button className="btn back-btn" onClick={() => setOpenMeal(null)} aria-label={`Back to ${label}`}>
                    <ChevronLeftIcon />
                    {label}
                </button>
                <div>
                    <h1 ref={mealTitleRef} tabIndex={-1}>{mealLabel(openMeal)}</h1>
                    <p className="muted">{isNearDay ? `${label} · ${shortDate(day.date)}` : label}</p>
                </div>
            </header>
        );
        content = (
            <>
                <MealSummary summary={summary} dayTargetKcal={day.targetKcal} />
                {actions}
                <RecentFoods foods={recent} onPick={(food) => pickFood(food)} />

                <section className="day-log" aria-labelledby="log-title">
                    {/* The heading says where to drop while a food is being dragged (no layout jump) */}
                    <h2 id="log-title" className="list-meta">
                        {isDragging ? 'Drop below to add' : count === 0 ? 'Logged' : `Logged · ${count} ${count === 1 ? 'item' : 'items'}`}
                    </h2>
                    {/* The meal's whole list is one drop zone. A dropped food opens the add sheet for this meal. */}
                    <Droppable droppableId={`meal:${openMeal}`}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`drop-zone${isDragging ? ' ready' : ''}${snapshot.isDraggingOver ? ' active' : ''}`}
                            >
                                {count === 0 ? (
                                    <div className="card empty-state">
                                        <p><strong>Nothing in {mealWord(openMeal)} yet</strong></p>
                                        <p className="muted">
                                            {isLaptop ? 'Drag a food here from your library, or tap it to add.' : 'Tap Add food, or use quick add for something not in your library.'}
                                        </p>
                                    </div>
                                ) : (
                                    <EntryList entries={summary.entries} onEdit={editEntry} />
                                )}
                                <div className="drop-placeholder">{provided.placeholder}</div>
                            </div>
                        )}
                    </Droppable>
                </section>
            </>
        );
    }
    else
    {
        // ---------- The day: the title says which day; the arrows move a day at a time ----------
        // The date under it only when the title doesn't already show it ("Today", "Yesterday"),
        // and short for yesterday, so it fits beside the Today button on a phone.
        header = (
            <header className="page-header day-header">
                <div>
                    <h1>{label}</h1>
                    {day && label === 'Today' && <p className="muted">{longDate(day.date)}</p>}
                    {day && label === 'Yesterday' && <p className="muted">{shortDate(day.date)}</p>}
                </div>
                <div className="day-arrows">
                    {!isToday && day && (
                        <button className="btn" onClick={() => goToDate(today)}>Today</button>
                    )}
                    <button className="icon-btn" aria-label="Previous day" disabled={!day} onClick={() => goToDate(addDays(day.date, -1))}>
                        <ChevronLeftIcon />
                    </button>
                    <button className="icon-btn" aria-label="Next day" disabled={!day || isToday} onClick={() => goToDate(addDays(day.date, 1))}>
                        <ChevronRightIcon />
                    </button>
                </div>
            </header>
        );

        if (loadError)
        {
            content = (
                <section className="card empty-state" role="alert">
                    <p>Couldn't load this day.</p>
                    <p className="muted">{loadError}</p>
                    <button className="btn" onClick={retry}>Try again</button>
                </section>
            );
        }
        else if (!day)
        {
            content = <p className="muted" role="status">Loading…</p>;
        }
        else
        {
            const unsorted = day.unsortedEntries.length;
            content = (
                <>
                    <DaySummary day={day} />
                    {actions}
                    <RecentFoods foods={recent} onPick={(food) => pickFood(food)} />

                    <section className="meals" aria-labelledby="meals-title">
                        <h2 id="meals-title" className="list-meta">{isDragging ? 'Drop on a meal to add' : 'Meals'}</h2>
                        {/* divs with list roles, not <ul>/<li>: the drag library's placeholder inside each card
                            copies the dragged row's tag (an <li>), and an <li> can't sit inside another */}
                        <div className="meal-list" role="list">
                            {day.meals.map((summary) => (
                                <div key={summary.meal} role="listitem">
                                    <MealCard summary={summary} isDragging={isDragging} onOpen={() => setOpenMeal(summary.meal)} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Logged before there were meals. Nothing guesses which meal they were: you sort them. */}
                    {unsorted > 0 && (
                        <section className="day-log" aria-labelledby="unsorted-title">
                            <h2 id="unsorted-title" className="list-meta">
                                Not sorted yet · {unsorted} {unsorted === 1 ? 'item' : 'items'}
                            </h2>
                            <p className="field-hint">Logged before meals were added. They count in the day's total. Tap one to put it in a meal.</p>
                            <EntryList entries={day.unsortedEntries} onEdit={editEntry} />
                        </section>
                    )}
                </>
            );
        }
    }

    // DragDropContext: everything that can be dragged (library, recent foods) and the meals they're dropped on
    // has to be inside the same one
    return (
        <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
            <div className={isLaptop ? 'today-layout' : 'today-stack'}>
                <div className="today-main">
                    {header}
                    {content}
                </div>

                {isLaptop && (
                    <aside className="card library-panel" aria-labelledby="library-title">
                        <h2 id="library-title" className="section-title">Your foods</h2>
                        <FoodPicker
                            foods={foods}
                            loadError={foodsError}
                            onRetry={onRetryFoods}
                            onPick={(food) => day && pickFood(food)}
                            onQuickAdd={(name) => day && openQuickAdd(name)}
                            draggable
                        />
                    </aside>
                )}

                <Sheet title={sheetTitle} isOpen={sheet !== null} onClose={() => setSheet(null)}>
                    {sheetContent}
                </Sheet>
            </div>
        </DragDropContext>
    );
}

export default Today;
