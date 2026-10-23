import { useEffect, useState } from 'react';
import { SEXES, ACTIVITY_LEVELS, GOALS } from '../profileOptions';
import { ageOn, todayString, yearsBefore } from '../dates';
import FormActions from './FormActions';

// Which fields each version of the form shows. The saved profile always gets all of them:
// the ones not shown keep their saved values.
const FIELDS = {
    all: ['sex', 'birthDate', 'heightCm', 'weightKg', 'activityLevel', 'goal'],
    body: ['sex', 'birthDate', 'heightCm', 'weightKg', 'activityLevel'],
    goal: ['goal'],
};

// Empty on first run, or filled with the saved profile when editing.
// Numbers are kept as text while typing, because an input's value is always text.
function initialValues(profile)
{
    return {
        sex: profile?.sex ?? '',
        birthDate: profile?.birthDate ?? '',
        heightCm: profile ? String(profile.heightCm) : '',
        weightKg: profile ? String(profile.weightKg) : '',
        activityLevel: profile?.activityLevel ?? '',
        goal: profile?.goal ?? '',
    };
}

// The same limits as the API, checked here first so a mistake shows next to its field straight away.
// The API still checks everything: this is only for a quicker, clearer message.
function validate(values)
{
    const errors = {};
    const today = todayString();

    if (!values.sex) errors.sex = 'Choose one';

    if (!values.birthDate) errors.birthDate = 'Enter your date of birth';
    else if (values.birthDate > yearsBefore(today, 18)) errors.birthDate = 'You need to be 18 or older to use this calculator';
    else if (values.birthDate <= yearsBefore(today, 101)) errors.birthDate = 'Check the year: that would make you over 100';

    const height = Number(values.heightCm);
    if (values.heightCm === '') errors.heightCm = 'Enter your height';
    else if (!(height >= 100 && height <= 250)) errors.heightCm = 'Height must be between 100 and 250 cm';

    const weight = Number(values.weightKg);
    if (values.weightKg === '') errors.weightKg = 'Enter your weight';
    else if (!(weight >= 30 && weight <= 300)) errors.weightKg = 'Weight must be between 30 and 300 kg';

    if (!values.activityLevel) errors.activityLevel = 'Choose your activity level';
    if (!values.goal) errors.goal = 'Choose a goal';

    return errors;
}

// The profile form. First run: every field and one button (submitLabel). Profile's sub-pages:
// fields = 'body' or 'goal', with Save and Cancel (onCancel), and onDirtyChange says whether anything changed.
// It only checks and collects the values; onSave (from the parent) does the saving and returns the saved profile.
// If saving fails, the message shows here and what you typed stays.
function ProfileForm({ profile, submitLabel, onSave, fields = 'all', onCancel = null, onDirtyChange })
{
    const [values, setValues] = useState(() => initialValues(profile));
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const shown = FIELDS[fields];
    const isShown = (name) => shown.includes(name);
    const isDirty = shown.some((name) => values[name] !== initialValues(profile)[name]);

    // Tell the page whether leaving now would lose changes (and that it wouldn't, once this form goes)
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);
    useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

    // One change handler for every field: the input's name says which value to update
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined })); // the user is fixing it: hide the old message
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        // Only the fields on screen can be fixed here, so only they are checked
        const found = Object.fromEntries(Object.entries(validate(values)).filter(([name]) => isShown(name)));
        setErrors(found);
        const firstProblem = Object.keys(found)[0];
        if (firstProblem)
        {
            document.getElementById(firstProblem)?.focus(); // take the user to the first thing to fix
            return;
        }

        setIsSaving(true);
        try
        {
            // The parent moves on (first run: the result; Profile: back to the overview with the new target)
            await onSave({
                ...values,
                heightCm: Number(values.heightCm),
                weightKg: Number(values.weightKg),
            });
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

    // Props every input gets: marked invalid and linked to its error text, so screen readers read the message too
    const describe = (name) => ({
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `${name}-error` : undefined,
    });

    const errorFor = (name) => errors[name] && (
        <p className="field-error" id={`${name}-error`}>{errors[name]}</p>
    );

    // A group of radio buttons shown as rows. The first radio gets the id, so validation can focus the group.
    const choiceGroup = (name, legend, options, className = 'options') => (
        <fieldset className="field" {...describe(name)}>
            <legend className="field-label">{legend}</legend>
            <div className={className}>
                {options.map((o, i) => (
                    <label key={o.value} className={values[name] === o.value ? 'option selected' : 'option'}>
                        <input
                            type="radio"
                            id={i === 0 ? name : undefined}
                            name={name}
                            value={o.value}
                            checked={values[name] === o.value}
                            onChange={handleChange}
                        />
                        <span className="option-text">
                            <span className="option-label">{o.label}</span>
                            {o.hint && <span className="option-hint">{o.hint}</span>}
                        </span>
                    </label>
                ))}
            </div>
            {errorFor(name)}
        </fieldset>
    );

    // The age a valid date of birth gives, shown under the field (the target is worked out from it)
    const age = /^\d{4}-\d{2}-\d{2}$/.test(values.birthDate) ? ageOn(values.birthDate, todayString()) : null;

    return (
        <form className="profile-form" onSubmit={handleSubmit} noValidate>
            {isShown('sex') && choiceGroup('sex', 'Sex', SEXES, 'options segmented')}

            {isShown('birthDate') && (
                <div className="field">
                    <label htmlFor="birthDate" className="field-label">Date of birth</label>
                    <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        className="input"
                        max={yearsBefore(todayString(), 18)}
                        value={values.birthDate}
                        onChange={handleChange}
                        {...describe('birthDate')}
                    />
                    {age !== null && !errors.birthDate && <p className="field-hint num">Age {age}</p>}
                    {errorFor('birthDate')}
                </div>
            )}

            {isShown('heightCm') && (
                <div className="field-pair">
                    <div className="field">
                        <label htmlFor="heightCm" className="field-label">Height (cm)</label>
                        <input
                            id="heightCm"
                            name="heightCm"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="input num"
                            value={values.heightCm}
                            onChange={handleChange}
                            {...describe('heightCm')}
                        />
                        {errorFor('heightCm')}
                    </div>

                    <div className="field">
                        <label htmlFor="weightKg" className="field-label">Weight (kg)</label>
                        <input
                            id="weightKg"
                            name="weightKg"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            className="input num"
                            value={values.weightKg}
                            onChange={handleChange}
                            {...describe('weightKg')}
                        />
                        {errorFor('weightKg')}
                    </div>
                </div>
            )}

            {isShown('activityLevel') && choiceGroup('activityLevel', 'Activity level', ACTIVITY_LEVELS)}
            {isShown('goal') && choiceGroup('goal', 'Goal', GOALS)}

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            {onCancel ? (
                <FormActions isSaving={isSaving} onCancel={onCancel} />
            ) : (
                <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                    {isSaving ? 'Saving…' : submitLabel}
                </button>
            )}
        </form>
    );
}

export default ProfileForm;
