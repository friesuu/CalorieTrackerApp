import './App.css';
import { useState, useEffect } from 'react';
import { getProfile, saveProfile, getFoods, createFood } from './api';
import { PAGES } from './pages';
import { formatKcal } from './numbers';
import Navigation from './components/Navigation';
import FirstRun from './components/FirstRun';
import Profile from './components/Profile';
import Foods from './components/Foods';

// What the pages that aren't built yet will hold. Each is replaced by the real page in its build step.
const COMING_SOON = {
  today: 'Your daily log arrives in step 5.',
  history: 'Your last 7 days arrive in step 7.',
};

function App()
{
  // undefined = still asking the server, null = no profile yet (first run), object = the profile
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState(null);
  const [view, setView] = useState('today'); // which page is shown, see pages.js
  const [foods, setFoods] = useState(null); // the food library, A to Z. null = not loaded yet
  const [foodsError, setFoodsError] = useState(null);
  const hasProfile = Boolean(profile);

  // Once, when the page opens: load the profile (this also checks the server is reachable)
  useEffect(() => {
    getProfile().then(setProfile).catch((err) => setError(err.message));
  }, []);

  // Once there's a profile (straight away, or after the first run): load the food library.
  // Kept here in App, not in the Foods page, because the daily log will use the same list.
  useEffect(() => {
    if (!hasProfile) return;
    getFoods().then(setFoods).catch((err) => setFoodsError(err.message));
  }, [hasProfile]);

  const retryFoods = () => {
    setFoodsError(null);
    getFoods().then(setFoods).catch((err) => setFoodsError(err.message));
  };

  const retry = () => {
    setError(null);
    getProfile().then(setProfile).catch((err) => setError(err.message));
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

  // Adding a food: save it, then put it in the list in A to Z order.
  // No try/catch: if saving fails, the error goes up to FoodForm, which shows it and keeps what was typed.
  const handleCreateFood = async (input) => {
    const created = await createFood(input);
    setFoods((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  // Choose the screen. These come after all the hooks above: React needs the same hooks on every render.
  if (profile === undefined)
  {
    return(
      <main className="status-screen">
        {error ? (
          <div className="card status-card" role="alert">
            <h1>Can't connect</h1>
            <p className="muted">{error}</p>
            <button className="btn btn-primary" onClick={retry}>Try again</button>
          </div>
        ) : (
          <p className="muted" role="status">Loading…</p>
        )}
      </main>
    );
  }

  // Nothing else is shown until the profile exists: every screen needs the calorie target
  if (profile === null)
  {
    return <FirstRun onSave={saveProfile} onDone={handleFirstRunDone} />;
  }

  const page = PAGES.find((p) => p.value === view);

  return(
    <div className="app">
      <Navigation currentView={view} onNavigate={setView} />

      <main className="page">
        <header className="page-header">
          <h1>{page.label}</h1>
        </header>

        {view === 'profile' && <Profile profile={profile} onSave={handleSaveProfile} />}

        {view === 'foods' && (
          <Foods foods={foods} loadError={foodsError} onRetry={retryFoods} onCreate={handleCreateFood} />
        )}

        {COMING_SOON[view] && (
          <section className="card empty-state">
            <p>Your daily target is <strong className="num">{formatKcal(profile.target.targetKcal)} kcal</strong>.</p>
            <p className="muted">{COMING_SOON[view]}</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
