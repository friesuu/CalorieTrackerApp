import { useEffect, useState } from 'react';
import FormActions from './FormActions';

// "Add exercise calories to my daily budget": one checkbox, saved with Save (Cancel throws the change away).
// Today follows it straight away; days already logged keep the setting they had (like the target).
// onDirtyChange: whether it's been changed and not saved.
function ExerciseSetting({ profile, onSave, onCancel, onDirtyChange })
{
    const [isOn, setIsOn] = useState(profile.exerciseInBudget);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const isDirty = isOn !== profile.exerciseInBudget;
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);
    useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        setIsSaving(true);
        try
        {
            await onSave({ exerciseInBudget: isOn }); // the page then goes back to the overview
        }
        catch (err)
        {
            setServerError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <form className="setting-form" onSubmit={handleSubmit} noValidate>
            <div className="options">
                <label className={isOn ? 'option selected' : 'option'}>
                    <input
                        type="checkbox"
                        checked={isOn}
                        onChange={(e) => setIsOn(e.target.checked)}
                        aria-describedby="exercise-setting-hint"
                    />
                    <span className="option-text">
                        <span className="option-label">Add exercise calories to my daily budget</span>
                        <span className="option-hint" id="exercise-setting-hint">
                            Calories you burn are added to what you can eat that day. Burn estimates from watches
                            and gym machines are often high, so many people leave this off.
                        </span>
                    </span>
                </label>
            </div>

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default ExerciseSetting;
