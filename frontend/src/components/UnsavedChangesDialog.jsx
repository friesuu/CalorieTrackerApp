import Sheet from './Sheet';

// "Discard your changes?" when you try to leave a Profile sub-page with something unsaved
// (the back button, the menu, another section). Keep editing is first, so it's the one in focus.
function UnsavedChangesDialog({ isOpen, onKeep, onDiscard })
{
    return (
        <Sheet title="Discard your changes?" isOpen={isOpen} onClose={onKeep}>
            <div className="sheet-stack">
                <p>You changed something on this page and haven't saved it yet.</p>
                <div className="confirm-actions">
                    <button type="button" className="btn" onClick={onKeep}>Keep editing</button>
                    <button type="button" className="btn btn-danger" onClick={onDiscard}>Discard changes</button>
                </div>
            </div>
        </Sheet>
    );
}

export default UnsavedChangesDialog;
