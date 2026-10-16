import { useState } from 'react';
import { formatKcal, formatPortion, formatServing } from '../numbers';
import { mealLabel, mealWord } from '../meals';
import MealChooser from './MealChooser';
import { MinusIcon, PlusIcon } from './Icons';

const STEP = 0.5; // the − and + buttons; any other amount (e.g. 0.25) can be typed

// How many servings of a food (adding it, or changing a logged entry), and which meal it's in.
// item is a food or a log entry: both have name, servingSize, servingUnit and kcalPerServing.
// meal: the meal it goes in, or null when it isn't known yet. chooseMeal shows the four meals to pick from.
// editing: changing a logged entry. Picking another meal MOVES it there, and picking one is optional.
// findMerge(meal, servings): the logged entry this will join (the same food is already in that meal), or null.
// submitLabel: text, or a function of the chosen meal (so it can say "Add to lunch")
function QuantityForm({
    item, initialQuantity = 1, meal: initialMeal = null, chooseMeal = false, editing = false,
    submitLabel, onSave, findMerge = null, onDay = 'today',
})
{
    const [quantity, setQuantity] = useState(String(initialQuantity));
    const [meal, setMeal] = useState(initialMeal);
    const [error, setError] = useState(null);
    const [mealError, setMealError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const amount = Number(quantity);
    const isValid = quantity !== '' && amount > 0 && amount <= 100;
    // Over 100 servings in total, the server makes a new row instead: findMerge then finds nothing, so no note
    const mergeWith = findMerge && meal ? findMerge(meal, isValid ? amount : 0) : null;
    const portion = (servings) => formatPortion(Math.round(servings * 100) / 100, item.servingSize, item.servingUnit);

    let mealHint = null;
    if (editing) mealHint = initialMeal ? 'Pick another meal to move it there.' : 'Not sorted yet. Pick a meal to put it in.';

    // − and + round to the step first, so 1.3 then + gives 1.5, not 1.8
    const step = (direction) => {
        const current = isValid ? amount : 0;
        const next = Math.round((current + direction * STEP) / STEP) * STEP;
        setQuantity(String(Math.min(Math.max(next, STEP), 100)));
        setError(null);
    };

    const chooseNewMeal = (value) => {
        setMeal(value);
        setMealError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const quantityProblem = isValid ? null : 'Enter how many servings, more than 0';
        const mealProblem = meal === null && !editing ? 'Pick the meal this is for' : null;
        setError(quantityProblem);
        setMealError(mealProblem);
        if (quantityProblem || mealProblem)
        {
            document.getElementById(quantityProblem ? 'quantity' : 'meal')?.focus(); // the first thing to fix
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave(amount, meal);
        }
        catch (err)
        {
            setServerError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <form className="quantity-form" onSubmit={handleSubmit} noValidate>
            <div>
                <p className="quantity-name">{item.name}</p>
                <p className="muted num">{formatServing(item.servingSize, item.servingUnit)} · {formatKcal(item.kcalPerServing)} kcal</p>
            </div>

            <div className="field">
                <label htmlFor="quantity" className="field-label">Servings</label>
                <div className="stepper">
                    <button type="button" className="btn stepper-btn" onClick={() => step(-1)} aria-label="One less" disabled={isValid && amount <= STEP}>
                        <MinusIcon />
                    </button>
                    <input
                        id="quantity"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        className="input num stepper-input"
                        value={quantity}
                        onChange={(e) => { setQuantity(e.target.value); setError(null); }}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? 'quantity-error' : 'quantity-total'}
                    />
                    <button type="button" className="btn stepper-btn" onClick={() => step(1)} aria-label="One more">
                        <PlusIcon />
                    </button>
                    {/* aria-live: the new total is read out after each − or + */}
                    <p className="stepper-total num" id="quantity-total" aria-live="polite">
                        {isValid ? `${formatKcal(amount * item.kcalPerServing)} kcal` : '–'}
                    </p>
                </div>
                {error && <p className="field-error" id="quantity-error">{error}</p>}
            </div>

            {chooseMeal && <MealChooser value={meal} onChange={chooseNewMeal} error={mealError} hint={mealHint} />}

            {/* So adding more of a food (or moving it) never quietly changes a row you didn't expect */}
            {mergeWith && (
                <p className="merge-note">
                    {editing
                        ? `${mealLabel(meal)} already has ${item.name} (${portion(mergeWith.quantity)}). Moving it there joins them`
                        : `${item.name} is already in ${mealWord(meal)} ${onDay} (${portion(mergeWith.quantity)}). This adds to it`}
                    {isValid ? `: ${portion(mergeWith.quantity + amount)} in total.` : '.'}
                </p>
            )}

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : typeof submitLabel === 'function' ? submitLabel(meal) : submitLabel}
            </button>
        </form>
    );
}

export default QuantityForm;
