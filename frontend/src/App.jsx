import './App.css';
import { useState, useEffect } from 'react';
import { getProfile, saveProfile } from './api';
import { PAGES } from './pages';
import { formatKcal } from './numbers';
import Navigation from './components/Navigation';
import FirstRun from './components/FirstRun';
import Profile from './components/Profile';

// What the pages that aren't built yet will hold. Each is replaced by the real page in its build step.
const COMING_SOON = {
  today: 'Your daily log arrives in step 5.',
  foods: 'Your food library arrives in step 4.',
  history: 'Your last 7 days arrive in step 7.',
};

function App()
{
  // undefined = still asking the server, null = no profile yet (first run), object = the profile
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState(null);
  const [view, setView] = useState('today'); // which page is shown, see pages.js

  // Once, when the page opens: load the profile (this also checks the server is reachable)
  useEffect(() => {
    getProfile().then(setProfile).catch((err) => setError(err.message));
  }, []);

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

        {view === 'profile' ? (
          <Profile profile={profile} onSave={handleSaveProfile} />
        ) : (
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
