import ProfileForm from './ProfileForm';
import TargetCard from './TargetCard';

// The Profile page: the target and how it's worked out, then the details to edit.
// Saving goes through App (onSave), so the new target shows everywhere at once.
function Profile({ profile, onSave })
{
    return (
        <div className="profile-layout">
            <TargetCard profile={profile} />

            <section className="profile-details" aria-labelledby="details-title">
                <h2 id="details-title" className="section-title">Your details</h2>
                <ProfileForm profile={profile} submitLabel="Save changes" onSave={onSave} />
            </section>
        </div>
    );
}

export default Profile;
