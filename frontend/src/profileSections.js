// The Profile's settings, in list order (ProfileSettingsList), each opening its own page (Profile).
// intro: one line under the page's title, or null when the form explains itself.
export const PROFILE_SECTIONS = [
    { value: 'body', label: 'Body details', intro: 'Your daily target is worked out from these.' },
    { value: 'goal', label: 'Goal', intro: 'How fast you want to lose weight, if at all.' },
    { value: 'meals', label: 'Meal split', intro: null },
    { value: 'exercise', label: 'Exercise', intro: null },
    { value: 'account', label: 'Account', intro: null },
];

export function sectionOf(value)
{
    return PROFILE_SECTIONS.find((s) => s.value === value);
}
