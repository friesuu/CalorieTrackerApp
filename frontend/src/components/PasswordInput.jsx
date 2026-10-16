import { useState } from 'react';

// A password field with Show / Hide, so a password can be checked before sending it (handy on a phone).
// All other props (id, value, onChange, autoComplete, aria-...) go straight to the <input>.
function PasswordInput(props)
{
    const [isShown, setIsShown] = useState(false);

    return (
        <div className="password-input">
            <input {...props} type={isShown ? 'text' : 'password'} className="input" />
            {/* aria-pressed: screen readers say whether the password is showing */}
            <button
                type="button"
                className="password-toggle"
                aria-pressed={isShown}
                aria-label={isShown ? 'Hide password' : 'Show password'}
                onClick={() => setIsShown((shown) => !shown)}
            >
                {isShown ? 'Hide' : 'Show'}
            </button>
        </div>
    );
}

export default PasswordInput;
