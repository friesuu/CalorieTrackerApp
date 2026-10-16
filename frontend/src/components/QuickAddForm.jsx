import { useState } from 'react';
import MealChooser from './MealChooser';

// Calories without a library food, e.g. "Hawker dinner, 650 kcal". Saves as one entry; nothing goes in the library.
// meal: the meal it goes in, or null to ask (chooseMeal). submitLabel: text, or a function of the chosen meal.
function QuickAddForm({ initialName = '', meal: initialMeal = null, chooseMeal = false, submitLabel, onSave })
{
    const [name, setName] = useState(initialName);
    const [kcal, setKcal] = useState('');
    const [meal, setMeal] = useState(initialMeal);
    const [error, setError] = useState(null);
    const [mealError, setMealError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const amount = Number(kcal);
        const kcalProblem = kcal === '' || !Number.isInteger(amount) || amount < 1 || amount > 10000
            ? 'Enter the calories, a whole number from 1 to 10,000'
            : null;
        const mealProblem = meal === null ? 'Pick the meal this is for' : null;
        setError(kcalProblem);
        setMealError(mealProblem);
        if (kcalProblem || mealProblem)
        {
            document.getElementById(kcalProblem ? 'quick-kcal' : 'meal')?.focus();
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave({ name: name.trim() || null, kcal: amount, meal });
        }
        catch (err)
        {
            setServerError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <form className="food-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="quick-name" className="field-label">
                    What was it? <span className="field-optional">(optional)</span>
                </label>
                <input
                    id="quick-name"
                    type="text"
                    className="input"
                    autoComplete="off"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="field">
                <label htmlFor="quick-kcal" className="field-label">Calories (kcal)</label>
                <input
                    id="quick-kcal"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    className="input num"
                    value={kcal}
                    onChange={(e) => { setKcal(e.target.value); setError(null); }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'quick-kcal-error' : undefined}
                />
                {error && <p className="field-error" id="quick-kcal-error">{error}</p>}
            </div>

            {chooseMeal && <MealChooser value={meal} onChange={(value) => { setMeal(value); setMealError(null); }} error={mealError} />}

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : typeof submitLabel === 'function' ? submitLabel(meal) : submitLabel}
            </button>
        </form>
    );
}

export default QuickAddForm;
