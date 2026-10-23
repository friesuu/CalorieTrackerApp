import { useEffect, useState } from 'react';
import FormActions from './FormActions';
import { DEFAULT_SPLIT, MEALS, mealTargets } from '../meals';
import { formatKcal } from '../numbers';

// Numbers are kept as text while typing, because an input's value is always text
const asText = (split) => Object.fromEntries(MEALS.map((m) => [m.key, String(split[m.key])]));
const isWholePercent = (text) => /^\d{1,3}$/.test(text) && Number(text) <= 100;

// How the daily target is shared out between the meals, in whole percent that add up to 100.
// Each meal's kcal updates as you type, worked out the same way as the server's. Saving is blocked
// (with the reason) until the four add up to 100. onDirtyChange: whether anything changed.
function MealSplitForm({ profile, onSave, onCancel, onDirtyChange })
{
    const [values, setValues] = useState(() => asText(profile.mealSplit));
    const [error, setError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const saved = asText(profile.mealSplit);
    const isDirty = MEALS.some((m) => values[m.key] !== saved[m.key]);
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);
    useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

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
            await onSave({ mealSplit: split }); // the page then goes back to the overview
        }
        catch (err)
        {
            setServerError(err.message);
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

            {!isDefault && (
                <button type="button" className="link-btn split-reset" onClick={() => { setValues(asText(DEFAULT_SPLIT)); setError(null); }}>
                    Use 25 / 35 / 30 / 10
                </button>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}
            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <FormActions isSaving={isSaving} onCancel={onCancel} />
        </form>
    );
}

export default MealSplitForm;
