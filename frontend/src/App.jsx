import './App.css';
import { useState, useEffect, useCallback } from 'react';
import {
  getMe, logout, changePassword, getProfile, saveProfile, saveSettings, getFoods, createFood, updateFood, deleteFood,
  SESSION_EXPIRED_EVENT,
} from './api';
import { PAGES } from './pages';
import Navigation from './components/Navigation';
import FirstRun from './components/FirstRun';
import Profile from './components/Profile';
import Foods from './components/Foods';
import Today from './components/Today';
import History from './components/History';
import AuthScreen from './components/AuthScreen';

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
  }, []);

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

  // The meal split (and later the exercise setting): same idea, a separate form on the Profile page
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

  // The menu always goes to a page's normal start, e.g. Today = today, not a day opened from History
  const navigate = (page) => {
    setOpenDay(null);
    setView(page);
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
        <div className="card status-card" role="alert">
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
    return <main className="status-screen"><p className="muted" role="status">Loading…</p></main>;
  }

  // Nothing else is shown until the profile exists: every screen needs the calorie target
  if (profile === null)
  {
    return <FirstRun user={user} onSave={saveProfile} onDone={handleFirstRunDone} onLogout={handleLogout} />;
  }

  const page = PAGES.find((p) => p.value === view);

  return(
    <div className="app">
      <Navigation user={user} currentView={view} onNavigate={navigate} />

      <main className="page">
        {/* Today has its own header, with the day arrows */}
        {view !== 'today' && (
          <header className="page-header">
            <h1>{page.label}</h1>
          </header>
        )}

        {/* key: a different day opened from History starts a fresh Today page */}
        {view === 'today' && (
          <Today
            key={openDay ? openDay.date : 'today'}
            foods={foods}
            foodsError={foodsError}
            onRetryFoods={retryFoods}
            initialDate={openDay?.date}
            initialToday={openDay?.today}
          />
        )}

        {view === 'history' && <History onOpenDay={handleOpenDay} />}

        {view === 'profile' && (
          <Profile
            user={user}
            profile={profile}
            onSave={handleSaveProfile}
            onSaveSettings={handleSaveSettings}
            onChangePassword={changePassword}
            onLogout={handleLogout}
          />
        )}

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

      </main>
    </div>
  );
}

export default App;
