import { PAGES } from '../pages';
import { TodayIcon, FoodsIcon, HistoryIcon, ProfileIcon } from './Icons';

const ICONS = {
    today: <TodayIcon />,
    foods: <FoodsIcon />,
    history: <HistoryIcon />,
    profile: <ProfileIcon />,
};

// The menu. It only shows buttons; App decides what happens (onNavigate).
// The same buttons are a bottom tab bar on phones and a left sidebar on laptops: only the CSS changes (.nav in App.css).
function Navigation({ currentView, onNavigate })
{
    return(
        <nav className="nav" aria-label="Pages">
            {/* Only shown in the laptop sidebar; on a phone each page has its own title */}
            <div className="nav-brand">Calorie Tracker</div>

            <ul className="nav-list">
                {PAGES.map((p) => (
                    <li key={p.value}>
                        {/* aria-current tells screen readers which page is open, not just the colour */}
                        <button
                            className={currentView === p.value ? 'nav-item active' : 'nav-item'}
                            aria-current={currentView === p.value ? 'page' : undefined}
                            onClick={() => onNavigate(p.value)}
                        >
                            <span className="nav-icon">{ICONS[p.value]}</span>
                            <span>{p.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Navigation;
