import { useState } from 'react';
import { login, register } from '../api';
import PasswordInput from './PasswordInput';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // a quick check only; the server checks properly

// Error text under a field, linked to it for screen readers (aria-describedby)
function FieldError({ id, message })
{
    return message ? <p className="field-error" id={id}>{message}</p> : null;
}

// Props every input gets: marked invalid and linked to its error text
function describe(errors, name)
{
    return {
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `auth-${name}-error` : undefined,
    };
}

function LoginForm({ onLoggedIn })
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        const found = {};
        if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Enter your email address';
        if (!password) found.password = 'Enter your password';
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first)
        {
            document.getElementById(`auth-${first}`)?.focus();
            return;
        }

        setIsSending(true);
        try
        {
            onLoggedIn(await login(email.trim(), password));
        }
        catch (err)
        {
            // "Invalid email or password" or "Too many wrong passwords...": said as the server says it
            setServerError(err.message);
            setIsSending(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="auth-email" className="field-label">Email</label>
                <input
                    id="auth-email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    {...describe(errors, 'email')}
                />
                <FieldError id="auth-email-error" message={errors.email} />
            </div>

            <div className="field">
                <label htmlFor="auth-password" className="field-label">Password</label>
                <PasswordInput
                    id="auth-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    {...describe(errors, 'password')}
                />
                <FieldError id="auth-password-error" message={errors.password} />
            </div>

            {serverError && <p className="form-error" role="alert">{serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSending}>
                {isSending ? 'Logging in…' : 'Log in'}
            </button>
        </form>
    );
}

function SignUpForm({ onLoggedIn })
{
    const [values, setValues] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const change = (name) => (e) => {
        const { value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        // The same rules as the API's RegisterInput
        const found = {};
        if (!values.name.trim()) found.name = 'Enter your name';
        else if (values.name.trim().length > 50) found.name = 'Keep it under 50 characters';
        if (!EMAIL_PATTERN.test(values.email.trim())) found.email = 'Enter a valid email address';
        if (values.password.length < 8) found.password = 'Use at least 8 characters';
        else if (values.password.length > 128) found.password = 'Keep it under 128 characters';
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first)
        {
            document.getElementById(`auth-${first}`)?.focus();
            return;
        }

        setIsSending(true);
        try
        {
            onLoggedIn(await register(values.name.trim(), values.email.trim(), values.password));
        }
        catch (err)
        {
            // An email that's already used belongs next to the email field
            if (err.message === 'Email is already registered')
            {
                setErrors({ email: 'This email already has an account. Log in instead.' });
                document.getElementById('auth-email')?.focus();
            }
            else
            {
                setServerError(err.message);
            }
            setIsSending(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
                <label htmlFor="auth-name" className="field-label">Name</label>
                <input id="auth-name" type="text" className="input" autoComplete="name" maxLength={50}
                    value={values.name} onChange={change('name')} {...describe(errors, 'name')} />
                <FieldError id="auth-name-error" message={errors.name} />
            </div>

            <div className="field">
                <label htmlFor="auth-email" className="field-label">Email</label>
                <input id="auth-email" type="email" className="input" autoComplete="email" inputMode="email"
                    value={values.email} onChange={change('email')} {...describe(errors, 'email')} />
                <FieldError id="auth-email-error" message={errors.email} />
            </div>

            <div className="field">
                <label htmlFor="auth-password" className="field-label">Password</label>
                <p className="field-hint" id="auth-password-hint">At least 8 characters</p>
                <PasswordInput
                    id="auth-password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={change('password')}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-hint'}
                />
                <FieldError id="auth-password-error" message={errors.password} />
            </div>

            {serverError && <p className="form-error" role="alert">{serverError}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={isSending}>
                {isSending ? 'Creating your account…' : 'Create account'}
            </button>
        </form>
    );
}

// The screen before logging in: Log in, or Create account. notice: e.g. "Your session has expired..."
// The key on the form makes switching start a fresh, empty form.
function AuthScreen({ onLoggedIn, notice })
{
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const isLogin = mode === 'login';

    return (
        <main className="auth">
            <header className="auth-header">
                <img src="/favicon.svg" alt="" width="48" height="48" />
                <h1>{isLogin ? 'Log in' : 'Create your account'}</h1>
                <p className="muted">
                    {isLogin ? 'Welcome back to Calorie Tracker.' : 'Track what you eat, on your phone or laptop.'}
                </p>
            </header>

            {notice && <p className="auth-notice" role="status">{notice}</p>}

            {isLogin
                ? <LoginForm key="login" onLoggedIn={onLoggedIn} />
                : <SignUpForm key="register" onLoggedIn={onLoggedIn} />}

            <p className="auth-switch">
                {isLogin ? 'No account yet?' : 'Already have an account?'}{' '}
                <button type="button" className="link-btn" onClick={() => setMode(isLogin ? 'register' : 'login')}>
                    {isLogin ? 'Create one' : 'Log in'}
                </button>
            </p>
        </main>
    );
}

export default AuthScreen;
