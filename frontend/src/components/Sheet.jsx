import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

// A panel over the page: slides up from the bottom on phones, a centred box on laptops (App.css).
// Built on the browser's <dialog>, which does the hard accessibility work for us: focus moves inside,
// Esc closes it, and the page behind can't be clicked or tabbed into while it's open.
function Sheet({ title, isOpen, onClose, children })
{
    const dialogRef = useRef(null);

    // React says open/closed with isOpen; the <dialog> has to be told with showModal() / close()
    useEffect(() => {
        const dialog = dialogRef.current;
        if (isOpen && !dialog.open)
        {
            dialog.showModal();
            // The browser would focus the close button (the first button). Start in the first field instead.
            dialog.querySelector('.sheet-content input, .sheet-content button')?.focus();
        }
        if (!isOpen && dialog.open) dialog.close();
    }, [isOpen]);

    return(
        <dialog
            ref={dialogRef}
            className="sheet"
            aria-labelledby="sheet-title"
            // Esc: stop the browser closing it by itself and let React close it (through isOpen),
            // so React's isOpen and the dialog can never disagree
            onCancel={(e) => { e.preventDefault(); onClose(); }}
            // A click on the dim area outside the panel lands on the <dialog> itself: close
            onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
        >
            {/* Only rendered while open, so a form inside starts fresh every time */}
            {isOpen && (
                <div className="sheet-panel">
                    {/* The grab handle of a bottom sheet (phones only, App.css) */}
                    <div className="sheet-handle" aria-hidden="true" />
                    <header className="sheet-header">
                        <h2 id="sheet-title">{title}</h2>
                        <button className="icon-btn" onClick={onClose} aria-label="Close">
                            <CloseIcon />
                        </button>
                    </header>
                    <div className="sheet-content">{children}</div>
                </div>
            )}
        </dialog>
    );
}

export default Sheet;
