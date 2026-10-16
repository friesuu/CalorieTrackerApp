import { useEffect, useRef, useState } from 'react';
import ProfileForm from './ProfileForm';
import TargetCard from './TargetCard';

// The first screen after signing up: collect the profile, then show the target it gives.
// The saved profile is kept here (not in App) until "Start logging", so the result screen can be shown first.
function FirstRun({ user, onSave, onDone, onLogout })
{
    const [saved, setSaved] = useState(null);
    const resultHeadingRef = useRef(null);

    // When the result appears, move focus to its heading, so keyboard and screen reader users land on it
    useEffect(() => {
        if (saved) resultHeadingRef.current?.focus();
    }, [saved]);

    const handleSave = async (input) => {
        const profile = await onSave(input); // if this fails, ProfileForm shows the error
        setSaved(profile);
        return profile;
    };

    if (saved)
    {
        return (
            <main className="first-run">
                <header className="first-run-header">
                    <h1 ref={resultHeadingRef} tabIndex={-1}>Your target is ready</h1>
                    <p className="muted">Here's how it was worked out. You can change your details any time in Profile.</p>
                </header>
                <TargetCard profile={saved} />
                <button className="btn btn-primary btn-block" onClick={() => onDone(saved)}>
                    Start logging
                </button>
            </main>
        );
    }

    return (
        <main className="first-run">
            <header className="first-run-header">
                <h1>Welcome, {user.name}</h1>
                <p className="muted">
                    A few details first, so we can work out how many calories to aim for each day.
                </p>
            </header>
            <ProfileForm submitLabel="Work out my target" onSave={handleSave} />
            {/* Signed up with the wrong account on a shared computer? A way out before anything else */}
            <p className="auth-switch">
                Not {user.name}?{' '}
                <button type="button" className="link-btn" onClick={onLogout}>Log out</button>
            </p>
        </main>
    );
}

export default FirstRun;
