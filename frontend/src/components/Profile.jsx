import { useEffect, useRef, useState } from 'react';
import { DESKTOP_UP } from '../breakpoints';
import { useMediaQuery } from '../useMediaQuery';
import { formatKcal } from '../numbers';
import TargetCard from './TargetCard';
import ProfileSummary from './ProfileSummary';
import { sectionOf } from '../profileSections';
import ProfileSettingsList from './ProfileSettingsList';
import ProfileForm from './ProfileForm';
import MealSplitForm from './MealSplitForm';
import ExerciseSetting from './ExerciseSetting';
import AccountPage from './AccountPage';
import Avatar from './Avatar';
import { ChevronLeftIcon } from './Icons';

// What saveProfile needs, taken from a saved profile. Undo saves the old one again with it.
function toInput(profile)
{
    const { sex, birthDate, heightCm, weightKg, activityLevel, goal } = profile;
    return { sex, birthDate, heightCm, weightKg, activityLevel, goal };
}

// "Saved. Daily target 1,850 → 1,720 kcal." after changing the body details or the goal
function targetChange(before, after)
{
    const from = before.target.targetKcal;
    const to = after.target.targetKcal;
    const change = from === to
        ? `Saved. Your daily target stays ${formatKcal(to)} kcal.`
        : `Saved. Daily target ${formatKcal(from)} → ${formatKcal(to)} kcal.`;
    return after.target.capped ? `${change} That's the safe minimum for you, see below.` : change;
}

// Who's logged in, at the top of the Profile
function Identity({ user })
{
    return (
        <div className="profile-identity">
            <Avatar user={user} size="xlarge" />
            <div className="identity-text">
                <p className="identity-name">{user.name}</p>
                <p className="muted identity-email">{user.email}</p>
            </div>
        </div>
    );
}

// What just happened ("Saved. Daily target …"), with Undo after a change to the target.
// It gets the focus when it appears, so screen readers read it out and Undo is one Tab away.
function Notice({ notice, noticeRef, onUndo, isUndoing })
{
    const isError = notice.kind === 'error';
    return (
        <div
            ref={noticeRef}
            tabIndex={-1}
            className={isError ? 'form-error profile-notice' : 'form-success profile-notice'}
            role={isError ? 'alert' : 'status'}
        >
            <p className="notice-text">{notice.text}</p>
            {notice.undo && (
                <button type="button" className="link-btn notice-action" onClick={onUndo} disabled={isUndoing}>
                    {isUndoing ? 'Undoing…' : 'Undo'}
                </button>
            )}
        </div>
    );
}

// The Profile: an overview (who you are, the target, this week, and the settings list), and a page for
// each setting with Save and Cancel. Phones and tablets: one at a time, a sub-page has a back button.
// Laptops (1024px and up): the list on the left, the overview or the open setting on the right.
// Saving goes through App (onSave, onSaveSettings), so the new target shows everywhere at once.
// onDirtyChange and guardLeave come from App: leaving a setting with unsaved changes asks first.
function Profile({ user, profile, onSave, onSaveSettings, onChangePassword, onLogout, menuButton, onDirtyChange, guardLeave })
{
    const isDesktop = useMediaQuery(DESKTOP_UP);
    const [section, setSection] = useState(null); // null = the overview, or a PROFILE_SECTIONS value
    const [notice, setNotice] = useState(null); // { kind: 'success' | 'error', text, undo?: the old details }
    const [isUndoing, setIsUndoing] = useState(false);

    // Where focus goes once the page has changed: 'title', 'notice' or an element's id.
    // (After a new page, focus would otherwise be lost on the body.)
    const titleRef = useRef(null);
    const noticeRef = useRef(null);
    const focusNext = useRef(null);

    useEffect(() => {
        const target = focusNext.current;
        if (!target) return;
        focusNext.current = null;
        // A moment later: "Discard changes" closes its dialog in this same update, and until then
        // the page behind it can't take the focus
        const timer = setTimeout(() => {
            if (target === 'title' || target === 'notice')
            {
                window.scrollTo(0, 0); // a new page starts at the top (the notice is at the top too)
                (target === 'title' ? titleRef : noticeRef).current?.focus({ preventScroll: true });
            }
            else document.getElementById(target)?.focus();
        }, 0);
        return () => clearTimeout(timer);
    }, [section, notice]);

    // Open a setting, or the overview (null). With unsaved changes, App asks first.
    const open = (next) => {
        if (next === section) return;
        guardLeave(() => {
            // Back to the overview: to the row you came from (on a laptop the list never went away)
            focusNext.current = next ? 'title' : isDesktop ? null : `profile-row-${section}`;
            setNotice(null);
            setSection(next);
        });
    };

    // Cancel: back without asking (throwing the changes away is what it's for), to the setting's row
    const cancel = () => {
        focusNext.current = `profile-row-${section}`;
        setSection(null);
    };

    // After a save: the overview, saying what changed
    const backWith = (message) => {
        focusNext.current = 'notice';
        setNotice(message);
        setSection(null);
    };

    // Body details and Goal: save straight away, then show the new target with Undo
    const saveDetails = async (input) => {
        const before = profile;
        const saved = await onSave(input); // if it throws, the form shows why
        backWith({ kind: 'success', text: targetChange(before, saved), undo: toInput(before) });
    };

    const undo = async () => {
        setIsUndoing(true);
        try
        {
            const saved = await onSave(notice.undo);
            focusNext.current = 'notice';
            setNotice({ kind: 'success', text: `Undone. Your daily target is back to ${formatKcal(saved.target.targetKcal)} kcal.` });
        }
        catch (err)
        {
            focusNext.current = 'notice';
            setNotice({ kind: 'error', text: `Couldn't undo: ${err.message}`, undo: notice.undo }); // Undo stays, to try again
        }
        finally
        {
            setIsUndoing(false);
        }
    };

    const saveMeals = async (input) => {
        await onSaveSettings(input);
        backWith({ kind: 'success', text: 'Meal split saved. Today uses it now; days already logged keep theirs.' });
    };

    const saveExercise = async (input) => {
        const saved = await onSaveSettings(input);
        backWith({
            kind: 'success',
            text: saved.exerciseInBudget
                ? 'Saved. Exercise calories are now added to your daily budget.'
                : 'Saved. Exercise calories are no longer added to your daily budget.',
        });
    };

    const dirty = { onCancel: cancel, onDirtyChange };
    const forms = {
        body: <ProfileForm profile={profile} fields="body" onSave={saveDetails} {...dirty} />,
        goal: <ProfileForm profile={profile} fields="goal" onSave={saveDetails} {...dirty} />,
        meals: <MealSplitForm profile={profile} onSave={saveMeals} {...dirty} />,
        exercise: <ExerciseSetting profile={profile} onSave={saveExercise} {...dirty} />,
        account: (
            <AccountPage
                user={user}
                onChangePassword={onChangePassword}
                onLogout={onLogout}
                onSaved={(text) => backWith({ kind: 'success', text })}
                guardLeave={guardLeave}
                {...dirty}
            />
        ),
    };

    const current = section && sectionOf(section);
    const notices = notice && <Notice notice={notice} noticeRef={noticeRef} onUndo={undo} isUndoing={isUndoing} />;
    const overview = (
        <>
            {notices}
            <TargetCard profile={profile} hero />
            <ProfileSummary refreshOn={profile} />
        </>
    );
    const intro = current?.intro && <p className="muted section-intro">{current.intro}</p>;

    // ---------- Laptops: the list on the left, the overview or the open setting on the right ----------
    if (isDesktop)
    {
        return (
            <>
                <header className="page-header">
                    <h1 className="page-title">Profile</h1>
                </header>
                <div className="page page-profile">
                    <Identity user={user} />
                    <div className="profile-columns">
                        <div className="profile-list">
                            <ProfileSettingsList profile={profile} user={user} current={section} onOpen={open} showOverview />
                        </div>
                        <div className="profile-section">
                            {current ? (
                                <section className="profile-section-body" aria-labelledby="section-title">
                                    <div className="setting-head">
                                        <h2 id="section-title" className="section-title" ref={titleRef} tabIndex={-1}>{current.label}</h2>
                                        {intro}
                                    </div>
                                    {forms[section]}
                                </section>
                            ) : overview}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ---------- Phones and tablets: a setting's page, with a back button ----------
    if (current)
    {
        return (
            <>
                <header className="page-header">
                    <button type="button" className="icon-btn" aria-label="Back to Profile" onClick={() => open(null)}>
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="page-title" ref={titleRef} tabIndex={-1}>{current.label}</h1>
                </header>
                <div className="page page-profile page-setting">
                    {intro}
                    {forms[section]}
                </div>
            </>
        );
    }

    // ---------- Phones and tablets: the overview ----------
    return (
        <>
            <header className="page-header">
                {menuButton}
                <h1 className="page-title">Profile</h1>
            </header>
            <div className="page page-profile">
                <Identity user={user} />
                {overview}
                <section aria-labelledby="settings-title" className="profile-settings">
                    <h2 id="settings-title" className="section-title">Settings</h2>
                    <ProfileSettingsList profile={profile} user={user} current={null} onOpen={open} />
                </section>
            </div>
        </>
    );
}

export default Profile;
