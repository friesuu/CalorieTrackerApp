import { PAGES } from '../pages';
import { TodayIcon, FoodsIcon, HistoryIcon } from './Icons';
import Avatar from './Avatar';

// The menu. It only shows buttons; App decides what happens (onNavigate).
// placement: 'sidebar' (always on screen from 720px wide) or 'drawer' (phones: opened with the menu button).
// The contents are the same in both. The Profile item shows your initial instead of an icon.
function Navigation({ user, currentView, onNavigate, placement })
{
    const icons = {
        today: <TodayIcon />,
        foods: <FoodsIcon />,
        history: <HistoryIcon />,
        profile: <Avatar user={user} />,
    };

    return(
        <nav className={`nav nav-${placement}`} aria-label="Pages">
            <div className="nav-brand">Calorie Tracker</div>

            <ul className="nav-list">
                {PAGES.map((p) => (
                    <li key={p.value}>
                        {/* aria-current tells screen readers which page is open, not just the colour */}
                        <button
                            className={currentView === p.value ? 'nav-item active' : 'nav-item'}
                            data-page={p.value}
                            aria-current={currentView === p.value ? 'page' : undefined}
                            onClick={() => onNavigate(p.value)}
                        >
                            <span className="nav-icon">{icons[p.value]}</span>
                            <span>{p.label}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {/* Who's logged in, at the bottom */}
            <div className="nav-user">
                <Avatar user={user} size="medium" />
                <div className="nav-user-text">
                    <span className="nav-user-name">{user.name}</span>
                    <span className="nav-user-email">{user.email}</span>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
