// The first letter of the user's name in a circle. Decoration only (aria-hidden):
// wherever it appears, the name is also written out, or the button has a label.
function Avatar({ user, size = 'small' })
{
    const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
    return <span className={`avatar avatar-${size}`} aria-hidden="true">{initial}</span>;
}

export default Avatar;
