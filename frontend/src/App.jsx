import './App.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMe, logout, changePassword, getProfile, saveProfile, saveSettings, getFoods, createFood, updateFood, deleteFood,
  SESSION_EXPIRED_EVENT,
} from './api';
import { PAGES } from './pages';
import { TABLET_UP } from './breakpoints';
import { useMediaQuery } from './useMediaQuery';
import Navigation from './components/Navigation';
import NavDrawer from './components/NavDrawer';
import { AlertIcon, MenuIcon } from './components/Icons';
import FirstRun from './components/FirstRun';
import Profile from './components/Profile';
import Foods from './components/Foods';
import Today from './components/Today';
import History from './components/History';
import AuthScreen from './components/AuthScreen';
import UnsavedChangesDialog from './components/UnsavedChangesDialog';

const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

function App()
{
  // undefined = still asking the server, null = nobody logged in, object = the logged-in user
  const [user, setUser] = useState(undefined);
  const [authNotice, setAuthNotice] = useState(null); // e.g. "Your session has expired..."
  // undefined = still asking the server, null = no profile yet (first run), object = the profile
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState(null); // the server can't be reached
  const [view, setView] = useState('today'); // which page is shown, see pages.js
  const [foods, setFoods] = useState(null); // the food library, A to Z. null = not loaded yet
  const [foodsError, setFoodsError] = useState(null);
  const hasProfile = Boolean(profile);
  // A day picked on the History page, to open on Today: { date, today }. null = Today shows today.
  const [openDay, setOpenDay] = useState(null);
  // From 720px wide the navigation is a sidebar. Narrower, it's a drawer opened with the menu button.
  const hasSidebar = useMediaQuery(TABLET_UP);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null); // focus goes back here when the drawer closes
  // A Profile sub-page has changes that aren't saved. Leaving it then asks first (see guardLeave).
  const [isDirty, setIsDirty] = useState(false);
  // What to do if you choose "Discard changes" (e.g. go to Today). null = the question isn't showing.
  const [pendingLeave, setPendingLeave] = useState(null);

  const userId = user?.id;

  // Once, when the page opens: ask the server who is logged in (the cookie is httpOnly, so we can't look ourselves)
  useEffect(() => {
    getMe().then(setUser).catch((err) => setError(err.message));
  }, []);

  // Whenever someone logs in: load THEIR profile
  useEffect(() => {
    if (!userId) return;
    getProfile().then(setProfile).catch((err) => setError(err.message));
  }, [userId]);

  // Once there's a profile (straight away, or after the first run): load the food library.
  // Kept here in App, not in the Foods page, because the daily log will use the same list.
  useEffect(() => {
    if (!userId || !hasProfile) return;
    getFoods().then(setFoods).catch((err) => setFoodsError(err.message));
  }, [userId, hasProfile]);

  // Back to the login screen. Also empties everything, so the next person on this phone or computer
  // never sees the previous user's data, not even for a moment. (useCallback: it only uses setters,
  // so it can be the same function forever, and the effect below never needs to re-subscribe.)
  const showLogin = useCallback((notice = null) => {
    setUser(null);
    setProfile(undefined);
    setFoods(null);
    setFoodsError(null);
    setView('today');
    setOpenDay(null);
    setError(null);
    setAuthNotice(notice);
    setIsMenuOpen(false);
    setIsDirty(false);
    setPendingLeave(null);
  }, []);

  // Closing or reloading the tab with unsaved changes: the browser asks its own "Leave site?" question
  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // older browsers need this to show the question
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Any request that finds the login gone (it expired, or a password change logged this device out)
  // fires this event from api.js: go back to the login screen and say why
  useEffect(() => {
    const handleExpired = () => showLogin(SESSION_EXPIRED);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [showLogin]);

  const handleLoggedIn = (loggedIn) => {
    setAuthNotice(null);
    setUser(loggedIn); // the effect above then loads their profile
  };

  // Only the server can delete the httpOnly cookie. If that fails, the error goes up to the button.
  const handleLogout = async () => {
    await logout();
    showLogin();
  };

  const retryFoods = () => {
    setFoodsError(null);
    getFoods().then(setFoods).catch((err) => setFoodsError(err.message));
  };

  // "Try again" after the server couldn't be reached: ask again whatever was being asked
  const retry = () => {
    setError(null);
    if (user === undefined) getMe().then(setUser).catch((err) => setError(err.message));
    else getProfile().then(setProfile).catch((err) => setError(err.message));
  };

  // First run finished: show the app, starting on Today
  const handleFirstRunDone = (saved) => {
    setProfile(saved);
    setView('today');
  };

  // Editing on the Profile page. Errors are shown inside the form, so they're passed back to it.
  const handleSaveProfile = async (input) => {
    const saved = await saveProfile(input);
    setProfile(saved);
    return saved;
  };

  // The meal split and the exercise setting: same idea, separate forms on the Profile page
  const handleSaveSettings = async (input) => {
    const saved = await saveSettings(input);
    setProfile(saved);
    return saved;
  };

  // Adding a food: save it, then put it in the list in A to Z order.
  // No try/catch: if saving fails, the error goes up to FoodForm, which shows it and keeps what was typed.
  const handleCreateFood = async (input) => {
    const created = await createFood(input);
    setFoods((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  // Editing can change the name, so the list is sorted again
  const handleUpdateFood = async (id, changes) => {
    const updated = await updateFood(id, changes);
    setFoods((prev) => prev.map((f) => (f.id === id ? updated : f)).sort((a, b) => a.name.localeCompare(b.name)));
    return updated;
  };

  const handleDeleteFood = async (id) => {
    await deleteFood(id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  // Every way of leaving a Profile sub-page goes through here: straight away, or after
  // "Discard your changes?" when something isn't saved
  const guardLeave = (leave) => {
    if (isDirty) setPendingLeave(() => leave);
    else leave();
  };

  const discardAndLeave = () => {
    const leave = pendingLeave;
    setPendingLeave(null);
    setIsDirty(false);
    leave();
  };

  // The menu always goes to a page's normal start, e.g. Today = today, not a day opened from History.
  // Choosing a page also closes the drawer (phones), straight away, even if the page then asks first.
  const navigate = (page) => {
    setIsMenuOpen(false);
    guardLeave(() => {
      setOpenDay(null);
      setView(page);
    });
  };

  const handleOpenDay = (date, today) => {
    setOpenDay({ date, today });
    setView('today');
  };

  // Choose the screen. These come after all the hooks above: React needs the same hooks on every render.
  if (error)
  {
    return(
      <main className="status-screen">
        <div className="card status-card empty-state" role="alert">
          <span className="empty-icon" aria-hidden="true"><AlertIcon /></span>
          <h1>Can't connect</h1>
          <p className="muted">{error}</p>
          <button className="btn btn-primary" onClick={retry}>Try again</button>
        </div>
      </main>
    );
  }

  if (user === null)
  {
    return <AuthScreen onLoggedIn={handleLoggedIn} notice={authNotice} />;
  }

  if (user === undefined || profile === undefined)
  {
    return <main className="status-screen"><p className="muted loading" role="status">Loading…</p></main>;
  }

  // Nothing else is shown until the profile exists: every screen needs the calorie target
  if (profile === null)
  {
    return <FirstRun user={user} onSave={saveProfile} onDone={handleFirstRunDone} onLogout={handleLogout} />;
  }

  const page = PAGES.find((p) => p.value === view);

  // Phones only: the button at the left of every page's header that opens the navigation drawer
  const menuButton = hasSidebar ? null : (
    <button
      ref={menuButtonRef}
      type="button"
      className="icon-btn"
      aria-label="Menu"
      aria-expanded={isMenuOpen}
      aria-controls="nav-drawer"
      onClick={() => setIsMenuOpen(true)}
    >
      <MenuIcon />
    </button>
  );

  return(
    <div className="app">
      {hasSidebar ? (
        <Navigation user={user} currentView={view} onNavigate={navigate} placement="sidebar" />
      ) : (
        <NavDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} returnFocusTo={menuButtonRef}>
          <Navigation user={user} currentView={view} onNavigate={navigate} placement="drawer" />
        </NavDrawer>
      )}

      <main className="main-panel">
        {/* Today and Profile have their own header and content (Today: the day arrows; Profile: a back button
            on its sub-pages). key: a different day opened from History starts a fresh Today page. */}
        {view === 'today' && (
          <Today
            key={openDay ? openDay.date : 'today'}
            foods={foods}
            foodsError={foodsError}
            onRetryFoods={retryFoods}
            initialDate={openDay?.date}
            initialToday={openDay?.today}
            menuButton={menuButton}
          />
        )}

        {view === 'profile' && (
          <Profile
            user={user}
            profile={profile}
            onSave={handleSaveProfile}
            onSaveSettings={handleSaveSettings}
            onChangePassword={changePassword}
            onLogout={handleLogout}
            menuButton={menuButton}
            onDirtyChange={setIsDirty}
            guardLeave={guardLeave}
          />
        )}

        {(view === 'history' || view === 'foods') && (
          <>
            <header className="page-header">
              {menuButton}
              <h1 className="page-title">{page.label}</h1>
            </header>

            <div className="page page-narrow">
              {view === 'history' && <History onOpenDay={handleOpenDay} />}

              {view === 'foods' && (
                <Foods
                  foods={foods}
                  loadError={foodsError}
                  onRetry={retryFoods}
                  onCreate={handleCreateFood}
                  onUpdate={handleUpdateFood}
                  onDelete={handleDeleteFood}
                />
              )}
            </div>
          </>
        )}
      </main>

      <UnsavedChangesDialog isOpen={pendingLeave !== null} onKeep={() => setPendingLeave(null)} onDiscard={discardAndLeave} />
    </div>
  );
}

export default App;
