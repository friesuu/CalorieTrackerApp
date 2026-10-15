import { useState } from 'react';
import { formatKcal, formatServing } from '../numbers';
import { MinusIcon, PlusIcon } from './Icons';

const STEP = 0.5; // the − and + buttons; any other amount (e.g. 0.25) can be typed

// How many servings of a food (adding it, or changing a logged entry).
// item is a food or a log entry: both have name, servingSize, servingUnit and kcalPerServing.
function QuantityForm({ item, initialQuantity = 1, submitLabel, onSave })
{
    const [quantity, setQuantity] = useState(String(initialQuantity));
    const [error, setError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const amount = Number(quantity);
    const isValid = quantity !== '' && amount > 0 && amount <= 100;

    // − and + round to the step first, so 1.3 then + gives 1.5, not 1.8
    const step = (direction) => {
        const current = isValid ? amount : 0;
        const next = Math.round((current + direction * STEP) / STEP) * STEP;
        setQuantity(String(Math.min(Math.max(next, STEP), 100)));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        if (!isValid)
        {
            setError('Enter how many servings, more than 0');
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave(amount);
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

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

export default QuantityForm;
