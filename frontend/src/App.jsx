import './App.css';
import { useState, useEffect } from 'react';
import { getMe } from './api';
import { PAGES } from './pages';
import Navigation from './components/Navigation';

// What each page will hold. Temporary: each one is replaced by the real page in its build step.
const COMING_SOON = {
  today: 'Your daily log arrives in step 5.',
  foods: 'Your food library arrives in step 4.',
  history: 'Your last 7 days arrive in step 7.',
  profile: 'Your profile and calorie target arrive in step 3.',
};

function App()
{
  // undefined = still asking the server, object = connected
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(null);
  const [view, setView] = useState('today'); // which page is shown, see pages.js

  // Once, when the page opens: check the API (and its database) answer
  useEffect(() => {
    getMe().then(setUser).catch((err) => setError(err.message));
  }, []);

  const retry = () => {
    setError(null);
    getMe().then(setUser).catch((err) => setError(err.message));
  };

  // Choose the screen. These come after all the hooks above: React needs the same hooks on every render.
  if (user === undefined)
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

  const page = PAGES.find((p) => p.value === view);

  return(
    <div className="app">
      <Navigation currentView={view} onNavigate={setView} />

      <main className="page">
        <header className="page-header">
          <h1>{page.label}</h1>
        </header>

        <section className="card empty-state">
          <p className="muted">{COMING_SOON[view]}</p>
        </section>
      </main>
    </div>
  );
}

export default App;
