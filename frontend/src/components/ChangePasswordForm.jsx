import { useEffect, useState } from 'react';
import PasswordInput from './PasswordInput';
import FormActions from './FormActions';

// Asks for the current password too: someone at your unlocked phone shouldn't be able to take over
// the account by changing it. onSave does the request; if it throws, the message shows here.
// onCancel: show Save and Cancel (the Account page). onDirtyChange: whether anything has been typed.
function ChangePasswordForm({ onSave, onCancel = null, onDirtyChange })
{
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const isDirty = current !== '' || next !== '';
    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);
    useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const found = {};
        if (!current) found.current = 'Enter your current password';
        if (next.length < 8) found.next = 'Use at least 8 characters';
        else if (next === current) found.next = 'Choose a different password from the current one';
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first)
        {
            document.getElementById(`password-${first}`)?.focus();
            return;
        }

        setIsSaving(true);
        try
        {
            await onSave(current, next);
        }
        catch (err)
        {
            setServerError(err.message); // e.g. "Current password is incorrect"
            setIsSaving(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="password-current" className="field-label">Current password</label>
                <PasswordInput
                    id="password-current"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => { setCurrent(e.target.value); setErrors((p) => ({ ...p, current: undefined })); }}
                    aria-invalid={errors.current ? true : undefined}
                    aria-describedby={errors.current ? 'password-current-error' : undefined}
                />
                {errors.current && <p className="field-error" id="password-current-error">{errors.current}</p>}
            </div>

            <div className="field">
                <label htmlFor="password-next" className="field-label">New password</label>
                <p className="field-hint" id="password-next-hint">At least 8 characters. Your other devices will be logged out.</p>
                <PasswordInput
                    id="password-next"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => { setNext(e.target.value); setErrors((p) => ({ ...p, next: undefined })); }}
                    aria-invalid={errors.next ? true : undefined}
                    aria-describedby={errors.next ? 'password-next-error' : 'password-next-hint'}
                />
                {errors.next && <p className="field-error" id="password-next-error">{errors.next}</p>}
            </div>

            {serverError && <p className="form-error" role="alert">Couldn't change it: {serverError}</p>}

            {onCancel ? (
                <FormActions isSaving={isSaving} onCancel={onCancel} saveLabel="Change password" />
            ) : (
                <button type="submit" className="btn btn-primary btn-block" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Change password'}
                </button>
            )}
        </form>
    );
}

export default ChangePasswordForm;
