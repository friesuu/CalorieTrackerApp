import { useState } from 'react';

// Calories without a library food, e.g. "Hawker dinner, 650 kcal". Saves as one entry; nothing goes in the library.
function QuickAddForm({ initialName = '', submitLabel, onSave })
{
    const [name, setName] = useState(initialName);
    const [kcal, setKcal] = useState('');
    const [error, setError] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const amount = Number(kcal);
        if (kcal === '' || !Number.isInteger(amount) || amount < 1 || amount > 10000)
        {
            setError('Enter the calories, a whole number from 1 to 10,000');
            document.getElementById('quick-kcal')?.focus();
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave({ name: name.trim() || null, kcal: amount });
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

            {serverError && <p className="form-error" role="alert">Couldn't save: {serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                {isSaving ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

export default QuickAddForm;
