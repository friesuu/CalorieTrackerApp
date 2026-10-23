import { useState } from 'react';
import ChangePasswordForm from './ChangePasswordForm';

// Profile → Account: who you are (the email can't be changed here), Log out, and Change password
// (with Save and Cancel). Logging out with a half-typed password asks first, like any other way of leaving.
// onSaved(message): back to the overview, saying the password changed.
function AccountPage({ user, onChangePassword, onLogout, onSaved, onCancel, onDirtyChange, guardLeave })
{
    const [logoutError, setLogoutError] = useState(null);

    const handleLogout = () => guardLeave(async () => {
        setLogoutError(null);
        try
        {
            await onLogout();
        }
        catch (err)
        {
            setLogoutError(`Couldn't log out: ${err.message}`); // the cookie is still there, so don't pretend
        }
    });

    const handleChangePassword = async (current, next) => {
        await onChangePassword(current, next); // if it throws, the form shows why and keeps what was typed
        onSaved('Password changed. Any other device you were logged in on has been logged out.');
    };

    return (
        <div className="account-page">
            <dl className="card list-card info-list">
                <div className="info-row">
                    <dt>Name</dt>
                    <dd>{user.name}</dd>
                </div>
                <div className="info-row">
                    <dt>Email</dt>
                    <dd>{user.email}</dd>
                </div>
            </dl>

            {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
            <button type="button" className="btn btn-block" onClick={handleLogout}>Log out</button>

            <section className="account-password" aria-labelledby="password-title">
                <h3 id="password-title">Change password</h3>
                <ChangePasswordForm onSave={handleChangePassword} onCancel={onCancel} onDirtyChange={onDirtyChange} />
            </section>
        </div>
    );
}

export default AccountPage;
