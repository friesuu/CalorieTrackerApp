// The choices in the profile form. Values are the API's enum names.
export const SEXES = [
    { value: 'FEMALE', label: 'Female' },
    { value: 'MALE', label: 'Male' },
]

export const ACTIVITY_LEVELS = [
    { value: 'SEDENTARY', label: 'Sedentary', hint: 'Desk job, little or no exercise' },
    { value: 'LIGHT', label: 'Lightly active', hint: 'Exercise 1–3 days a week' },
    { value: 'MODERATE', label: 'Moderately active', hint: 'Exercise 3–5 days a week' },
    { value: 'ACTIVE', label: 'Active', hint: 'Exercise 6–7 days a week' },
    { value: 'VERY_ACTIVE', label: 'Very active', hint: 'Hard exercise every day, or a physical job' },
]

export const GOALS = [
    { value: 'MAINTAIN', label: 'Maintain weight', hint: 'Eat what your body uses' },
    { value: 'LOSE_0_25', label: 'Lose 0.25 kg a week', hint: '275 kcal a day less' },
    { value: 'LOSE_0_5', label: 'Lose 0.5 kg a week', hint: '550 kcal a day less' },
    { value: 'LOSE_0_75', label: 'Lose 0.75 kg a week', hint: '825 kcal a day less' },
]
