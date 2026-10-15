// Line icons for the menu. Inline SVG like the task board's: no icon library needed,
// and currentColor makes each icon take its button's text colour.

// The shared frame: size, line style, and hidden from screen readers (the button's text already says what it is)
function Icon({ children })
{
    return(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {children}
        </svg>
    );
}

// A calendar page with today's dot
export function TodayIcon()
{
    return(
        <Icon>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
            <path d="M3.5 10h17" />
            <circle cx="12" cy="15" r="1.25" fill="currentColor" />
        </Icon>
    );
}

// A bowl with steam
export function FoodsIcon()
{
    return(
        <Icon>
            <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" />
            <path d="M9 8c0-1.2 1-1.8 1-3" />
            <path d="M14 8c0-1.2 1-1.8 1-3" />
        </Icon>
    );
}

// Three bars, like the week view
export function HistoryIcon()
{
    return(
        <Icon>
            <path d="M5 20V11" />
            <path d="M12 20V5" />
            <path d="M19 20v-6" />
        </Icon>
    );
}

// A head and shoulders
export function ProfileIcon()
{
    return(
        <Icon>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </Icon>
    );
}
