// Cancel and Save at the end of a Profile sub-page's form. Phones: a bar stuck to the bottom of the screen,
// Save on top (full width). From 720px: at the bottom right of the form, Save last (App.css .form-actions).
// Cancel throws the changes away on purpose, so it doesn't ask first.
function FormActions({ isSaving, onCancel, saveLabel = 'Save' })
{
    return (
        <div className="form-actions">
            <button type="button" className="btn" onClick={onCancel} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : saveLabel}
            </button>
        </div>
    );
}

export default FormActions;
