import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { getDailyLog, getRecentFoods, addLogEntry, quickAdd, updateLogEntry, deleteLogEntry } from '../api';
import { addDays, dayLabel, longDate } from '../dates';
import { useMediaQuery } from '../useMediaQuery';
import DaySummary from './DaySummary';
import LogEntryRow from './LogEntryRow';
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

// The daily log: what's left today, what you ate, and adding more.
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

    // A new day starts at midnight. Coming back to the app (phone unlocked, tab reopened) reloads
    // "today", so after midnight it shows the new, empty day. Past days are kept, never wiped.
    useEffect(() => {
        if (selectedDate !== null) return;
        const handleVisible = () => {
            if (document.visibilityState === 'visible') loadDay();
        };
        document.addEventListener('visibilitychange', handleVisible);
        return () => document.removeEventListener('visibilitychange', handleVisible);
    }, [selectedDate, loadDay]);

    const goToDate = (date) => {
        setDay(null); // shows "Loading…" instead of the old day's numbers
        setLoadError(null);
        setSheet(null);
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
    const handleAdd = async (food, quantity) => {
        await applyChange(addLogEntry({ foodId: food.id, quantity, date: day.date }));
        loadRecent(); // this food is now the most recent
    };
    const handleQuickAdd = (input) => applyChange(quickAdd({ ...input, date: day.date }));
    const handleUpdateEntry = (entry, quantity) => applyChange(updateLogEntry(entry.id, quantity));
    const handleRemoveEntry = (entry) => applyChange(deleteLogEntry(entry.id));

    const pickFood = (food) => setSheet({ type: 'add', food });
    const openQuickAdd = (name) => setSheet({ type: 'quick', name });

    // Dropped on the log: open "how many servings?" for that food, the same as tapping it.
    // Draggable ids are 'library:12' or 'recent:12' (the food's id after the colon).
    const handleDragEnd = ({ destination, draggableId }) => {
        setIsDragging(false);
        if (destination?.droppableId !== 'log') return; // dropped somewhere else, or Esc pressed

        const id = Number(draggableId.split(':')[1]);
        const food = foods?.find((f) => f.id === id) ?? recent?.find((f) => f.id === id);
        if (food && day) pickFood(food);
    };

    const label = day && today ? dayLabel(day.date, today) : 'Today';
    const addLabel = label === 'Today' || label === 'Yesterday' ? `Add to ${label.toLowerCase()}` : `Add to ${label}`;
    const isToday = selectedDate === null;

    // What's in the sheet depends on what was tapped
    let sheetTitle = '';
    let sheetContent = null;
    if (sheet?.type === 'pick')
    {
        sheetTitle = 'Add food';
        sheetContent = (
            <FoodPicker foods={foods} loadError={foodsError} onRetry={onRetryFoods} onPick={pickFood} onQuickAdd={openQuickAdd} />
        );
    }
    else if (sheet?.type === 'add')
    {
        sheetTitle = 'Add food';
        sheetContent = <QuantityForm item={sheet.food} submitLabel={addLabel} onSave={(q) => handleAdd(sheet.food, q)} />;
    }
    else if (sheet?.type === 'edit')
    {
        sheetTitle = 'Edit entry';
        sheetContent = (
            <div className="sheet-stack">
                <QuantityForm
                    item={sheet.entry}
                    initialQuantity={sheet.entry.quantity}
                    submitLabel="Save"
                    onSave={(q) => handleUpdateEntry(sheet.entry, q)}
                />
                <RemoveButton onRemove={() => handleRemoveEntry(sheet.entry)} />
            </div>
        );
    }
    else if (sheet?.type === 'quick')
    {
        sheetTitle = 'Quick add';
        sheetContent = <QuickAddForm initialName={sheet.name} submitLabel={addLabel} onSave={handleQuickAdd} />;
    }

    let content;
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
        const count = day.entries.length;
        content = (
            <>
                <DaySummary day={day} />

                <div className="day-actions">
                    {/* On a laptop the library is already on screen, beside the log */}
                    {!isLaptop && (
                        <button className="btn btn-primary" onClick={() => setSheet({ type: 'pick' })}>
                            <PlusIcon />
                            Add food
                        </button>
                    )}
                    <button className="btn" onClick={() => openQuickAdd('')}>Quick add</button>
                </div>

                <RecentFoods foods={recent} onPick={pickFood} />

                <section className="day-log" aria-labelledby="log-title">
                    {/* The heading says where to drop while a food is being dragged (no layout jump) */}
                    <h2 id="log-title" className="list-meta">
                        {isDragging ? 'Drop below to add' : count === 0 ? 'Logged' : `Logged · ${count} ${count === 1 ? 'item' : 'items'}`}
                    </h2>
                    {/* The whole log is one drop zone. It holds no draggables: a dropped food is added at the end. */}
                    <Droppable droppableId="log">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`drop-zone${isDragging ? ' ready' : ''}${snapshot.isDraggingOver ? ' active' : ''}`}
                            >
                                {count === 0 ? (
                                    <div className="card empty-state">
                                        <p><strong>{isToday ? 'Nothing logged yet today' : 'Nothing logged on this day'}</strong></p>
                                        <p className="muted">
                                            {isLaptop ? 'Drag a food here from your library, or tap it to add.' : 'Tap Add food, or use quick add for something not in your library.'}
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="card list-card">
                                        {day.entries.map((entry) => (
                                            <li key={entry.id}>
                                                <button className="row-button" onClick={() => setSheet({ type: 'edit', entry })} aria-label={`Edit ${entry.name}`}>
                                                    <LogEntryRow entry={entry} />
                                                    <span className="row-chevron"><ChevronRightIcon size={18} /></span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </section>
            </>
        );
    }

    // DragDropContext: everything that can be dragged (library, recent foods) and the log they're dropped on
    // has to be inside the same one
    return (
        <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
            <div className={isLaptop ? 'today-layout' : 'today-stack'}>
                <div className="today-main">
                    {/* The title says which day is on screen; the arrows move a day at a time */}
                    <header className="page-header day-header">
                        <div>
                            <h1>{label}</h1>
                            {day && <p className="muted">{longDate(day.date)}</p>}
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
