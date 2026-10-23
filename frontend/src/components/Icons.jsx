// Line icons. Inline SVG like the task board's: no icon library needed,
// and currentColor makes each icon take its button's text colour.

// The shared frame: size, line style, and hidden from screen readers (the button's text or aria-label says what it is)
function Icon({ children, size = 20 })
{
    return(
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {children}
        </svg>
    );
}

// The three page icons are 18px in the navigation (the default); empty states draw them bigger.
// A calendar page with today's dot
export function TodayIcon({ size = 18 })
{
    return(
        <Icon size={size}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
            <path d="M3.5 10h17" />
            <circle cx="12" cy="15" r="1.25" fill="currentColor" />
        </Icon>
    );
}

// A bowl with steam
export function FoodsIcon({ size = 18 })
{
    return(
        <Icon size={size}>
            <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" />
            <path d="M9 8c0-1.2 1-1.8 1-3" />
            <path d="M14 8c0-1.2 1-1.8 1-3" />
        </Icon>
    );
}

// Three bars, like the week view
export function HistoryIcon({ size = 18 })
{
    return(
        <Icon size={size}>
            <path d="M5 20V11" />
            <path d="M12 20V5" />
            <path d="M19 20v-6" />
        </Icon>
    );
}

// Three lines: the menu button that opens the navigation on phones
export function MenuIcon()
{
    return(
        <Icon size={20}>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </Icon>
    );
}

// A plus, for "Add"
export function PlusIcon()
{
    return(
        <Icon size={20}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </Icon>
    );
}

// An X, for closing a sheet
export function CloseIcon()
{
    return(
        <Icon size={20}>
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </Icon>
    );
}

// Arrows for "previous day" / "next day", and the > at the end of a row you can tap
export function ChevronLeftIcon()
{
    return(
        <Icon size={20}>
            <path d="M15 6l-6 6 6 6" />
        </Icon>
    );
}

export function ChevronRightIcon({ size = 20 })
{
    return(
        <Icon size={size}>
            <path d="M9 6l6 6-6 6" />
        </Icon>
    );
}

// The four meals (in their tinted circles, see MealIcon.jsx)
// Breakfast: the sun coming up
export function SunriseIcon()
{
    return(
        <Icon size={20}>
            <path d="M12 2v7" />
            <path d="M5 11l1.4 1.4" />
            <path d="M19 11l-1.4 1.4" />
            <path d="M2 18h2" />
            <path d="M20 18h2" />
            <path d="M22 22H2" />
            <path d="M8 5l4-3 4 3" />
            <path d="M16 18a4 4 0 0 0-8 0" />
        </Icon>
    );
}

// Lunch: the sun
export function SunIcon()
{
    return(
        <Icon size={20}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.9 4.9l1.4 1.4" />
            <path d="M17.7 17.7l1.4 1.4" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.3 17.7l-1.4 1.4" />
            <path d="M19.1 4.9l-1.4 1.4" />
        </Icon>
    );
}

// Dinner: the moon
export function MoonIcon()
{
    return(
        <Icon size={20}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </Icon>
    );
}

// Snacks: an apple
export function AppleIcon()
{
    return(
        <Icon size={20}>
            <path d="M12 20.9c1.5 0 2.8 1.1 4 1.1 3 0 6-8 6-12.2A4.9 4.9 0 0 0 17 5c-2.2 0-4 1.4-5 2-1-.6-2.8-2-5-2a4.9 4.9 0 0 0-5 4.8C2 14 5 22 8 22c1.3 0 2.5-1.1 4-1.1Z" />
            <path d="M10 2c1 .5 2 2 2 5" />
        </Icon>
    );
}

// A flame: calories burned in exercise
export function FlameIcon()
{
    return(
        <Icon size={20}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.4a2.5 2.5 0 0 0 2.5 2.4Z" />
        </Icon>
    );
}

// A magnifying glass, inside a search box
export function SearchIcon()
{
    return(
        <Icon size={18}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
        </Icon>
    );
}

// A circle with "!", for "something went wrong" (empty states that are errors)
export function AlertIcon()
{
    return(
        <Icon size={20}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5" />
            <path d="M12 16.25h.01" />
        </Icon>
    );
}

// A minus, for "one less"
export function MinusIcon()
{
    return(
        <Icon size={20}>
            <path d="M5 12h14" />
        </Icon>
    );
}
