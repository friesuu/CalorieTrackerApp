import { AppleIcon, MoonIcon, SunIcon, SunriseIcon } from './Icons';

const ICONS = { BREAKFAST: SunriseIcon, LUNCH: SunIcon, DINNER: MoonIcon, SNACK: AppleIcon };

// Each meal's own icon in a soft tinted circle, so the four meals are easy to tell apart at a glance.
// The colours are in App.css (.icon-circle.meal-...). Decoration only: the meal's name is always next to it.
function MealIcon({ meal })
{
    const Icon = ICONS[meal];
    return (
        <span className={`icon-circle meal-${meal.toLowerCase()}`} aria-hidden="true">
            <Icon />
        </span>
    );
}

export default MealIcon;
