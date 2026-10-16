import { useState } from 'react';
import { DEFAULT_SPLIT, MEALS, mealTargets } from '../meals';
import { formatKcal } from '../numbers';

// Numbers are kept as text while typing, because an input's value is always text
const asText = (split) => Object.fromEntries(MEALS.map((m) => [m.key, String(split[m.key])]));
const isWholePercent = (text) => /^\d{1,3}$/.test(text) && Number(text) <= 100;

// How the daily target is shared out between the meals, in whole percent that add up to 100.
// Each meal's kcal updates as you type, worked out the same way as the server's.
function MealSplitForm({ profile, onSave })
{
    const [values, setValues] = useState(() => asText(profile.mealSplit));
    const [error, setError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const targetKcal = profile.target.targetKcal;
    const allWhole = MEALS.every((m) => isWholePercent(values[m.key]));
    const split = Object.fromEntries(MEALS.map((m) => [m.key, Number(values[m.key])]));
    const total = allWhole ? MEALS.reduce((sum, m) => sum + split[m.key], 0) : null;
    // The exact kcal once it adds up to 100; until then, each meal's own share
    const kcal = total === 100 ? mealTargets(targetKcal, split) : null;
    const isDefault = MEALS.every((m) => values[m.key] === String(DEFAULT_SPLIT[m.key]));

    const change = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        setSuccess(null);

        if (!allWhole)
        {
            setError('Each meal needs a whole number from 0 to 100');
            return;
        }
        if (total !== 100)
        {
            setError(`The meals need to add up to 100%. Now they add up to ${total}%.`);
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave({ mealSplit: split });
            setSuccess("Saved. Today uses the new split; days already logged keep theirs.");
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

    return (
        <form className="split-form" onSubmit={handleSubmit} noValidate>
            <p className="field-hint">
                Your {formatKcal(targetKcal)} kcal day, shared out between your meals. Each meal on Today shows its share.
            </p>

            <div className="split-rows">
                {MEALS.map((m) => (
                    <div className="split-row" key={m.key}>
                        <label htmlFor={`split-${m.key}`} className="field-label">{m.label}</label>
                        <span className="split-input">
                            <input
                                id={`split-${m.key}`}
                                type="number"
                                inputMode="numeric"
                                step="1"
                                min="0"
                                max="100"
                                className="input num"
                                value={values[m.key]}
                                onChange={(e) => change(m.key, e.target.value)}
                                aria-invalid={isWholePercent(values[m.key]) ? undefined : true}
                                aria-describedby={`split-${m.key}-kcal`}
                            />
                            <span className="split-suffix" aria-hidden="true">%</span>
                        </span>
                        <span className="split-kcal num" id={`split-${m.key}-kcal`}>
                            {isWholePercent(values[m.key])
                                ? `${formatKcal(kcal ? kcal[m.key] : (targetKcal * split[m.key]) / 100)} kcal`
                                : '–'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Said in words, not only in colour; read out as it changes */}
            <p className={total === 100 ? 'split-total num' : 'split-total off num'} aria-live="polite">
                <span>Total</span>
                <span>{total === null ? '–' : total === 100 ? '100%' : `${total}% · needs to be 100%`}</span>
            </p>

            {error && <p className="form-error" role="alert">{error}</p>}
            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}
            {success && <p className="form-success" role="status">{success}</p>}

            <div className="split-actions">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save split'}
                </button>
                {!isDefault && (
                    <button type="button" className="link-btn" onClick={() => { setValues(asText(DEFAULT_SPLIT)); setError(null); setSuccess(null); }}>
                        Use 25 / 35 / 30 / 10
                    </button>
                )}
            </div>
        </form>
    );
}

export default MealSplitForm;
