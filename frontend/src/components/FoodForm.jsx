import { useState } from 'react';

// Common units, offered as suggestions while typing. Any other unit can still be typed.
const UNIT_SUGGESTIONS = ['g', 'ml', 'piece', 'cup', 'bowl', 'plate', 'slice', 'glass', 'tbsp', 'tsp', 'packet'];
const MACROS = [
    { name: 'proteinG', label: 'Protein (g)' },
    { name: 'carbsG', label: 'Carbs (g)' },
    { name: 'fatG', label: 'Fat (g)' },
];

// Text while typing (an input's value is always text). Empty macros stay '' = "don't know".
function initialValues(food, initialName)
{
    const text = (n) => (n === null || n === undefined ? '' : String(n));
    return {
        name: food?.name ?? initialName ?? '',
        servingSize: text(food?.servingSize),
        servingUnit: food?.servingUnit ?? '',
        kcalPerServing: text(food?.kcalPerServing),
        proteinG: text(food?.proteinG),
        carbsG: text(food?.carbsG),
        fatG: text(food?.fatG),
    };
}

// The same limits as the API (CreateFoodInput), checked here first for a quicker, clearer message
function validate(values)
{
    const errors = {};

    if (!values.name.trim()) errors.name = 'Enter a name';
    else if (values.name.trim().length > 100) errors.name = 'Keep the name under 100 characters';

    // Serving size and unit are optional. A size on its own ("250" what?) needs a unit though.
    const size = Number(values.servingSize);
    if (values.servingSize !== '' && !(size > 0 && size <= 10000)) errors.servingSize = 'Must be more than 0';
    else if (values.servingSize !== '' && !values.servingUnit.trim()) errors.servingUnit = 'Add a unit for this size, e.g. g or piece';

    if (values.servingUnit.trim().length > 30) errors.servingUnit = 'Keep the unit under 30 characters';

    const kcal = Number(values.kcalPerServing);
    if (values.kcalPerServing === '') errors.kcalPerServing = 'Enter the calories';
    else if (!Number.isInteger(kcal) || kcal < 0 || kcal > 5000) errors.kcalPerServing = 'A whole number from 0 to 5,000';

    for (const m of MACROS)
    {
        const grams = Number(values[m.name]);
        if (values[m.name] !== '' && !(grams >= 0 && grams <= 1000)) errors[m.name] = 'From 0 to 1,000';
    }

    return errors;
}

// What the API expects: numbers instead of text, and null for anything optional left empty
function toInput(values)
{
    const optional = (text) => (text === '' ? null : Number(text));
    return {
        name: values.name.trim(),
        servingSize: optional(values.servingSize),
        servingUnit: values.servingUnit.trim() || null,
        kcalPerServing: Number(values.kcalPerServing),
        proteinG: optional(values.proteinG),
        carbsG: optional(values.carbsG),
        fatG: optional(values.fatG),
    };
}

// Add (and later edit) a food. It only checks and collects the values: onSave does the saving.
// If onSave throws, the message is shown above the button and the form keeps what was typed.
function FoodForm({ food, initialName, submitLabel, onSave })
{
    const [values, setValues] = useState(() => initialValues(food, initialName));
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const found = validate(values);
        setErrors(found);
        const firstProblem = Object.keys(found)[0];
        if (firstProblem)
        {
            document.getElementById(`food-${firstProblem}`)?.focus();
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave(toInput(values));
        }
        catch (err)
        {
            setServerError(err.message);
        }
        finally
        {
            setIsSaving(false);
        }
    };

    // Everything an input needs: id (food- prefix, so it can't clash with ids elsewhere on the page),
    // its value, and the link to its error message for screen readers
    const inputProps = (name) => ({
        id: `food-${name}`,
        name,
        value: values[name],
        onChange: handleChange,
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `food-${name}-error` : undefined,
    });

    const errorFor = (name) => errors[name] && (
        <p className="field-error" id={`food-${name}-error`}>{errors[name]}</p>
    );

    const hasMacros = Boolean(values.proteinG || values.carbsG || values.fatG);

    return(
        <form className="food-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="food-name" className="field-label">Name</label>
                <input type="text" className="input" autoComplete="off" maxLength={100} {...inputProps('name')} />
                {errorFor('name')}
            </div>

            {/* Optional: leave both empty for a food you just count as "1 serving" */}
            <fieldset className="field" aria-describedby="serving-hint">
                <legend className="field-label">Serving <span className="field-optional">(optional)</span></legend>
                <p className="field-hint" id="serving-hint">e.g. 250&nbsp;ml or 1&nbsp;plate. Leave empty to count it as 1&nbsp;serving.</p>
                <div className="field-pair">
                    <div className="field">
                        <label htmlFor="food-servingSize" className="field-sublabel">Size</label>
                        <input type="number" inputMode="decimal" step="any" className="input num" {...inputProps('servingSize')} />
                        {errorFor('servingSize')}
                    </div>
                    <div className="field">
                        <label htmlFor="food-servingUnit" className="field-sublabel">Unit</label>
                        <input type="text" className="input" list="unit-suggestions" autoComplete="off" maxLength={30} {...inputProps('servingUnit')} />
                        <datalist id="unit-suggestions">
                            {UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}
                        </datalist>
                        {errorFor('servingUnit')}
                    </div>
                </div>
            </fieldset>

            <div className="field">
                <label htmlFor="food-kcalPerServing" className="field-label">Calories per serving (kcal)</label>
                <input type="number" inputMode="numeric" step="1" className="input num" {...inputProps('kcalPerServing')} />
                {errorFor('kcalPerServing')}
            </div>

            {/* Closed unless there are macros already: most foods won't have them */}
            <details className="macros" open={hasMacros || MACROS.some((m) => errors[m.name])}>
                <summary>Protein, carbs and fat (optional)</summary>
                <div className="field-trio">
                    {MACROS.map((m) => (
                        <div className="field" key={m.name}>
                            <label htmlFor={`food-${m.name}`} className="field-label">{m.label}</label>
                            <input type="number" inputMode="decimal" step="any" className="input num" {...inputProps(m.name)} />
                            {errorFor(m.name)}
                        </div>
                    ))}
                </div>
            </details>

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

export default FoodForm;
