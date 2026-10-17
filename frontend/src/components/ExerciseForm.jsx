import { useState } from 'react';

// Numbers are kept as text while typing, because an input's value is always text
function initialValues(exercise)
{
    return {
        name: exercise?.name ?? '',
        minutes: exercise?.minutes ? String(exercise.minutes) : '',
        kcal: exercise ? String(exercise.kcal) : '',
    };
}

// The same limits as the API (exercise.dto.ts), checked here first so the message shows next to its field
function validate(values)
{
    const errors = {};
    if (!values.name.trim()) errors.name = 'Enter what you did';

    const minutes = Number(values.minutes);
    if (values.minutes !== '' && !(Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440))
    {
        errors.minutes = 'Minutes must be a whole number from 1 to 1,440, or left empty';
    }

    const kcal = Number(values.kcal);
    if (values.kcal === '') errors.kcal = 'Enter the calories burned';
    else if (!(Number.isInteger(kcal) && kcal >= 1 && kcal <= 5000)) errors.kcal = 'Calories must be a whole number from 1 to 5,000';

    return errors;
}

// Log exercise, or change one: what you did, for how long (optional), and the calories it burned.
// The calories are typed in, never estimated here: they come from your watch, an app or the machine.
function ExerciseForm({ exercise = null, submitLabel, onSave })
{
    const [values, setValues] = useState(() => initialValues(exercise));
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
            document.getElementById(`exercise-${firstProblem}`)?.focus();
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave({
                name: values.name.trim(),
                minutes: values.minutes === '' ? null : Number(values.minutes),
                kcal: Number(values.kcal),
            });
        }
        catch (err)
        {
            setServerError(err.message);
            setIsSaving(false);
        }
    };

    // Marked invalid and linked to its error (or hint), so screen readers read the message too
    const describe = (name, hintId) => ({
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `exercise-${name}-error` : hintId,
    });

    const errorFor = (name) => errors[name] && (
        <p className="field-error" id={`exercise-${name}-error`}>{errors[name]}</p>
    );

    return (
        <form className="food-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="exercise-name" className="field-label">What did you do?</label>
                <input
                    id="exercise-name"
                    name="name"
                    type="text"
                    className="input"
                    autoComplete="off"
                    maxLength={100}
                    placeholder="e.g. Running"
                    value={values.name}
                    onChange={handleChange}
                    {...describe('name')}
                />
                {errorFor('name')}
            </div>

            <div className="field-pair">
                <div className="field">
                    <label htmlFor="exercise-minutes" className="field-label">
                        Minutes <span className="field-optional">(optional)</span>
                    </label>
                    <input
                        id="exercise-minutes"
                        name="minutes"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        className="input num"
                        value={values.minutes}
                        onChange={handleChange}
                        {...describe('minutes')}
                    />
                    {errorFor('minutes')}
                </div>

                <div className="field">
                    <label htmlFor="exercise-kcal" className="field-label">Calories burned</label>
                    <input
                        id="exercise-kcal"
                        name="kcal"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        className="input num"
                        value={values.kcal}
                        onChange={handleChange}
                        {...describe('kcal', 'exercise-kcal-hint')}
                    />
                    {errorFor('kcal')}
                </div>
            </div>
            <p className="field-hint" id="exercise-kcal-hint">From your watch, an app or the machine. The app doesn't estimate it for you.</p>

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

export default ExerciseForm;
