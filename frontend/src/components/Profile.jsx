import { useState } from 'react';
import ProfileForm from './ProfileForm';
import TargetCard from './TargetCard';
import MealSplitForm from './MealSplitForm';
import ExerciseSetting from './ExerciseSetting';
import ChangePasswordForm from './ChangePasswordForm';
import Sheet from './Sheet';
import Avatar from './Avatar';

// Who you are, with Change password and Log out. Logging out can fail (server down), so it says so.
function AccountCard({ user, onChangePassword, onLogout })
{
    const [isChanging, setIsChanging] = useState(false);
    const [success, setSuccess] = useState(null);
    const [logoutError, setLogoutError] = useState(null);

    const handleChangePassword = async (current, next) => {
        await onChangePassword(current, next); // if it throws, the form shows why and stays open
        setIsChanging(false);
        setSuccess('Password changed. Any other device you were logged in on has been logged out.');
    };

    const handleLogout = async () => {
        setLogoutError(null);
        try
        {
            await onLogout();
        }
        catch (err)
        {
            setLogoutError(`Couldn't log out: ${err.message}`); // the cookie is still there, so don't pretend
        }
    };

    return (
        <section className="card account-card" aria-labelledby="account-title">
            <div className="account-who">
                <Avatar user={user} size="large" />
                <div>
                    <h2 id="account-title" className="account-name">{user.name}</h2>
                    <p className="muted account-email">{user.email}</p>
                </div>
            </div>

            {success && <p className="form-success" role="status">{success}</p>}
            {logoutError && <p className="form-error" role="alert">{logoutError}</p>}

            <div className="account-actions">
                <button className="btn" onClick={() => { setSuccess(null); setIsChanging(true); }}>Change password</button>
                <button className="btn" onClick={handleLogout}>Log out</button>
            </div>

            <Sheet title="Change password" isOpen={isChanging} onClose={() => setIsChanging(false)}>
                <ChangePasswordForm onSave={handleChangePassword} />
            </Sheet>
        </section>
    );
}

// The Profile page: your account, the target and how it's worked out, then the details, meal split and
// exercise setting to edit.
// Saving goes through App (onSave, onSaveSettings), so the new target shows everywhere at once.
function Profile({ user, profile, onSave, onSaveSettings, onChangePassword, onLogout })
{
    return (
        <div className="profile-layout">
            <div className="profile-side">
                <AccountCard user={user} onChangePassword={onChangePassword} onLogout={onLogout} />
                <TargetCard profile={profile} />
            </div>

            <div className="profile-main">
                <section className="profile-details" aria-labelledby="details-title">
                    <h2 id="details-title" className="section-title">Your details</h2>
                    <ProfileForm profile={profile} submitLabel="Save changes" onSave={onSave} />
                </section>

                <section className="profile-details" aria-labelledby="split-title">
                    <h2 id="split-title" className="section-title">Meal split</h2>
                    <MealSplitForm profile={profile} onSave={onSaveSettings} />
                </section>

                <section className="profile-details" aria-labelledby="exercise-setting-title">
                    <h2 id="exercise-setting-title" className="section-title">Exercise</h2>
                    <ExerciseSetting profile={profile} onSave={onSaveSettings} />
                </section>
            </div>
        </div>
    );
}

export default Profile;
