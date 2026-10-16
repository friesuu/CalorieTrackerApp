import { MEALS } from '../meals';

// Which meal: four radio buttons, two by two. Nothing is picked until you pick one (no guessing).
// The first radio gets id="meal", so a form can move focus here to show what's missing.
function MealChooser({ value, onChange, error = null, hint = null })
{
    const describedBy = [hint && 'meal-hint', error && 'meal-error'].filter(Boolean).join(' ') || undefined;

    return (
        <fieldset className="field" aria-invalid={error ? true : undefined} aria-describedby={describedBy}>
            <legend className="field-label">Meal</legend>
            {hint && <p className="field-hint" id="meal-hint">{hint}</p>}
            <div className="options meal-options">
                {MEALS.map((m, i) => (
                    <label key={m.value} className={value === m.value ? 'option selected' : 'option'}>
                        <input
                            type="radio"
                            id={i === 0 ? 'meal' : undefined}
                            name="meal"
                            value={m.value}
                            checked={value === m.value}
                            onChange={() => onChange(m.value)}
                        />
                        <span className="option-label">{m.label}</span>
                    </label>
                ))}
            </div>
            {error && <p className="field-error" id="meal-error">{error}</p>}
        </fieldset>
    );
}

export default MealChooser;
