import { useState } from 'react';

// A destructive button that asks first, right where you pressed it (no browser pop-up):
// "Delete food" → "Delete Egg? …" [Keep it] [Delete]. onConfirm may throw: the message is shown here.
function ConfirmButton({ label, question, confirmLabel, onConfirm })
{
    const [isAsking, setIsAsking] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setError(null);
        setIsWorking(true);
        try
        {
            await onConfirm();
        }
        catch (err)
        {
            setError(err.message);
            setIsWorking(false);
        }
    };

    if (!isAsking)
    {
        return (
            <button type="button" className="btn btn-danger btn-block" onClick={() => setIsAsking(true)}>
                {label}
            </button>
        );
    }

    return (
        <div className="confirm" role="group" aria-label={label}>
            <p>{question}</p>
            {error && <p className="form-error" role="alert">Couldn't do that: {error}</p>}
            <div className="confirm-actions">
                <button type="button" className="btn" onClick={() => setIsAsking(false)} disabled={isWorking}>
                    Keep it
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={isWorking}>
                    {isWorking ? 'Working…' : confirmLabel}
                </button>
            </div>
        </div>
    );
}

export default ConfirmButton;
