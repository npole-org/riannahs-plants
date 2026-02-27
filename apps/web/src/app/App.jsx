import React, { useEffect, useState } from 'react';

const EMPTY_SUMMARY = { plants: 0, dueToday: 0, upcoming: 0, tasks: [] };

export function App({ summaryService, authService }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!role) {
      return () => {
        active = false;
      };
    }

    summaryService
      .getSummary()
      .then((result) => {
        if (active) {
          setSummary(result);
        }
      })
      .catch(() => {
        if (active) {
          setError('dashboard_load_failed');
        }
      });

    return () => {
      active = false;
    };
  }, [summaryService, role]);

  async function onLogin(event) {
    event.preventDefault();
    setError('');

    try {
      const result = await authService.login({ email, password });
      setRole(result.role);
      setPassword('');
    } catch (loginError) {
      setError(loginError.message || 'login_failed');
    }
  }

  async function onLogout() {
    await authService.logout();
    setRole(null);
    setSummary(EMPTY_SUMMARY);
  }

  return (
    <main style={{ fontFamily: 'system-ui', margin: '2rem auto', maxWidth: 720 }}>
      <h1>riannah's plants</h1>
      {!role ? (
        <section aria-label="login-form">
          <p>Sign in to continue.</p>
          <form onSubmit={onLogin}>
            <label>
              Email
              <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                required
              />
            </label>
            <button type="submit">Sign in</button>
          </form>
          {error ? <p role="alert">{error}</p> : null}
        </section>
      ) : (
        <>
          <p>Signed in as {role}.</p>
          <section aria-label="dashboard-summary">
            <p>Total plants: {summary.plants}</p>
            <p>Due today: {summary.dueToday}</p>
            <p>Upcoming: {summary.upcoming}</p>
          </section>
          <section aria-label="dashboard-due-list">
            <h2>Due tasks</h2>
            {summary.tasks.length === 0 ? (
              <p>No tasks due.</p>
            ) : (
              <ul>
                {summary.tasks.map((task) => (
                  <li key={`${task.plant_id}:${task.type}`}>
                    {task.nickname} · {task.type} · {task.due_on}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {error ? <p role="alert">{error}</p> : null}
          <button onClick={onLogout} type="button">
            Sign out
          </button>
        </>
      )}
    </main>
  );
}
