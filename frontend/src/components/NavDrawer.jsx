import { useEffect, useRef } from 'react';

// The navigation on phones: slides in from the left, over a dimmed page.
// Built on <dialog>, like Sheet, which does the hard accessibility work for us: focus stays inside
// while it's open, Esc closes it, and the page behind can't be clicked or tabbed into (App.css also
// stops the page scrolling behind it). It closes on Esc, on a tap on the dimmed page beside it,
// or when a page is chosen (App does that one). Focus then goes back to the menu button.
function NavDrawer({ isOpen, onClose, returnFocusTo, children })
{
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (isOpen && !dialog.open) dialog.showModal();
        if (!isOpen && dialog.open)
        {
            dialog.close();
            returnFocusTo.current?.focus();
        }
    }, [isOpen, returnFocusTo]);

    return (
        <dialog
            id="nav-drawer"
            ref={dialogRef}
            className="drawer"
            aria-label="Menu"
            // Esc: let React close it (through isOpen), so React and the dialog never disagree
            onCancel={(e) => { e.preventDefault(); onClose(); }}
            // A tap on the dimmed page lands on the <dialog> itself (everything inside is in .drawer-inner)
            onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
        >
            <div className="drawer-inner">{children}</div>
        </dialog>
    );
}

export default NavDrawer;
