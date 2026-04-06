import { useEffect, useState } from 'react';
import { testApi } from '../services/api.js';
import './Home.css';

/**
 * Home page — landing view for Easy Learn.
 * Demonstrates a live connection check to the Express API.
 */
function Home() {
  const [apiMessage, setApiMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ping the /api/test endpoint on mount to verify connectivity
  useEffect(() => {
    testApi()
      .then((data) => setApiMessage(data.message))
      .catch((err) => setError(err.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home">
      <section className="home__hero">
        <h1 className="home__title">
          Welcome to Easy Learn <span aria-hidden="true">🎮</span>
        </h1>
        <p className="home__subtitle">
          Gamified, accessible learning for every mind.
        </p>

        {/* API connectivity status */}
        <div className="home__api-card" role="status" aria-live="polite">
          <p className="home__api-label">Server status</p>
          {loading && <p className="home__api-msg">Connecting to server…</p>}
          {error && (
            <p className="home__api-msg home__api-msg--error">
              ⚠️ Server offline — {error}
            </p>
          )}
          {apiMessage && (
            <p className="home__api-msg home__api-msg--success">
              ✅ {apiMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
