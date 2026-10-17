import { useState } from 'react';

// "Add exercise calories to my daily budget". One checkbox that saves as soon as it's changed.
// Today follows it straight away; days already logged keep the setting they had (like the target).
function ExerciseSetting({ profile, onSave })
{
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState(null); // { ok, text } after saving

    const handleChange = async (e) => {
        const on = e.target.checked;
        setIsSaving(true);
        setResult(null);
        try
        {
            await onSave({ exerciseInBudget: on }); // App updates the profile, which ticks the box
            setResult({
                ok: true,
                text: on
                    ? "Saved. Exercise is now added to today's budget and every new day's."
                    : "Saved. Exercise still shows on Today, but isn't added to your budget.",
            });
        }
        catch (err)
        {
            setResult({ ok: false, text: `Couldn't save: ${err.message}` });
        }
        finally
        {
            setIsSaving(false);
        }
    };

    return (
        <div className="setting-form">
            <div className="options">
                <label className={profile.exerciseInBudget ? 'option selected' : 'option'}>
                    <input
                        type="checkbox"
                        checked={profile.exerciseInBudget}
                        onChange={handleChange}
                        disabled={isSaving}
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
            {result && <p className={result.ok ? 'form-success' : 'form-error'} role={result.ok ? 'status' : 'alert'}>{result.text}</p>}
        </div>
    );
}

export default ExerciseSetting;
