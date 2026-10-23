import { ACTIVITY_LEVELS, GOALS } from '../profileOptions';
import { PROFILE_SECTIONS } from '../profileSections';
import { formatAmount } from '../numbers';
import { ChevronRightIcon } from './Icons';

// The short preview under each row's name, e.g. "30 · 172 cm · 68 kg · Moderately active"
function previewOf(section, profile, user)
{
    switch (section)
    {
        case 'body':
        {
            const activity = ACTIVITY_LEVELS.find((a) => a.value === profile.activityLevel)?.label;
            return `${profile.age} · ${formatAmount(profile.heightCm)} cm · ${formatAmount(profile.weightKg)} kg · ${activity}`;
        }
        case 'goal':
            return GOALS.find((g) => g.value === profile.goal)?.label;
        case 'meals':
        {
            const { breakfast, lunch, dinner, snack } = profile.mealSplit;
            return `${breakfast} / ${lunch} / ${dinner} / ${snack}`;
        }
        case 'exercise':
            return `Added to budget: ${profile.exerciseInBudget ? 'On' : 'Off'}`;
        case 'account':
            return user.email;
        default:
            return '';
    }
}

// The settings-style list on the Profile: one row per section, each with a preview, opening its page.
// Laptop: it sits on the left and starts with "Overview"; the open one is marked (aria-current and a fill).
// Each row's id lets Profile put focus back on it when you come back.
function ProfileSettingsList({ profile, user, current, onOpen, showOverview = false })
{
    const rows = [
        ...(showOverview ? [{ value: null, label: 'Overview', preview: 'Your target and this week' }] : []),
        ...PROFILE_SECTIONS.map((s) => ({ value: s.value, label: s.label, preview: previewOf(s.value, profile, user) })),
    ];

    return (
        <nav aria-label="Profile settings">
            <ul className="card list-card settings-list">
                {rows.map((row) => {
                    const isCurrent = current === row.value;
                    return (
                        <li key={row.value ?? 'overview'}>
                            <button
                                type="button"
                                id={`profile-row-${row.value ?? 'overview'}`}
                                className={isCurrent ? 'row-button settings-row current' : 'row-button settings-row'}
                                aria-current={isCurrent ? 'page' : undefined}
                                onClick={() => onOpen(row.value)}
                            >
                                <span className="settings-text">
                                    <span className="settings-label">{row.label}</span>
                                    <span className="settings-preview num">{row.preview}</span>
                                </span>
                                <span className="row-chevron"><ChevronRightIcon size={18} /></span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default ProfileSettingsList;
