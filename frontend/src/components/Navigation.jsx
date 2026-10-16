import { PAGES } from '../pages';
import { TodayIcon, FoodsIcon, HistoryIcon } from './Icons';
import Avatar from './Avatar';

// The menu. It only shows buttons; App decides what happens (onNavigate).
// The same buttons are a bottom tab bar on phones and a left sidebar on laptops: only the CSS changes (.nav in App.css).
// The Profile tab shows your initial instead of an icon, so you can see who's logged in on a phone too.
function Navigation({ user, currentView, onNavigate })
{
    const icons = {
        today: <TodayIcon />,
        foods: <FoodsIcon />,
        history: <HistoryIcon />,
        profile: <Avatar user={user} />,
    };

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
                            <span className="nav-icon">{icons[p.value]}</span>
                            <span>{p.label}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {/* Laptop only: who's logged in, at the bottom of the sidebar */}
            <div className="nav-user">
                <Avatar user={user} />
                <div className="nav-user-text">
                    <span className="nav-user-name">{user.name}</span>
                    <span className="nav-user-email">{user.email}</span>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
