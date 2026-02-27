import React, { useEffect, useState } from 'react';

const EMPTY_SUMMARY = { plants: 0, dueToday: 0, upcoming: 0, tasks: [] };

export function App({ summaryService, authService, plantService }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [plants, setPlants] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [newPlantNickname, setNewPlantNickname] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [nextWaterOn, setNextWaterOn] = useState('');
  const [nextRepotOn, setNextRepotOn] = useState('');
  const [eventHistory, setEventHistory] = useState([]);

  async function loadDashboardData() {
    const [nextSummary, nextPlants] = await Promise.all([summaryService.getSummary(), plantService.listPlants()]);
    setSummary(nextSummary);
    setPlants(nextPlants);
  }

  useEffect(() => {
    let active = true;

    if (!role) {
      return () => {
        active = false;
      };
    }

    loadDashboardData().catch(() => {
      if (active) {
        setError('dashboard_load_failed');
      }
    });

    return () => {
      active = false;
    };
  }, [role]);

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
    setPlants([]);
    setSelectedPlantId('');
    setEventHistory([]);
  }

  async function onAddPlant(event) {
    event.preventDefault();
    if (!newPlantNickname.trim()) return;

    await plantService.createPlant({ nickname: newPlantNickname.trim() });
    setNewPlantNickname('');
    await loadDashboardData();
  }

  function startEdit(plant) {
    setEditingId(plant.id);
    setEditingNickname(plant.nickname);
  }

  async function saveEdit(plantId) {
    await plantService.updatePlant(plantId, { nickname: editingNickname.trim() });
    setEditingId(null);
    setEditingNickname('');
    await loadDashboardData();
  }

  async function removePlant(plantId) {
    await plantService.deletePlant(plantId);
    if (selectedPlantId === plantId) {
      setSelectedPlantId('');
      setEventHistory([]);
    }
    await loadDashboardData();
  }

  async function loadHistory(plantId) {
    const history = await plantService.listEvents(plantId);
    setSelectedPlantId(plantId);
    setEventHistory(history);
  }

  async function saveSchedule(event) {
    event.preventDefault();
    if (!selectedPlantId) return;
    await plantService.configureSchedule(selectedPlantId, {
      next_water_on: nextWaterOn || null,
      next_repot_on: nextRepotOn || null
    });
    await loadDashboardData();
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
          <section aria-label="plant-management">
            <h2>Plants</h2>
            <form onSubmit={onAddPlant}>
              <label>
                New plant nickname
                <input aria-label="New plant nickname" value={newPlantNickname} onChange={(event) => setNewPlantNickname(event.target.value)} />
              </label>
              <button type="submit">Add plant</button>
            </form>
            {plants.length === 0 ? (
              <p>No plants yet.</p>
            ) : (
              <ul>
                {plants.map((plant) => (
                  <li key={plant.id}>
                    {editingId === plant.id ? (
                      <>
                        <input value={editingNickname} onChange={(event) => setEditingNickname(event.target.value)} />
                        <button type="button" onClick={() => saveEdit(plant.id)}>
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingNickname('');
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{plant.nickname}</span>
                        <button type="button" onClick={() => startEdit(plant)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removePlant(plant.id)}>
                          Delete
                        </button>
                        <button type="button" onClick={() => loadHistory(plant.id)}>
                          History
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="schedule-config">
            <h2>Schedule config</h2>
            <p>Selected plant: {selectedPlantId || 'none'}</p>
            <form onSubmit={saveSchedule}>
              <label>
                Next water on
                <input type="date" value={nextWaterOn} onChange={(event) => setNextWaterOn(event.target.value)} />
              </label>
              <label>
                Next repot on
                <input type="date" value={nextRepotOn} onChange={(event) => setNextRepotOn(event.target.value)} />
              </label>
              <button type="submit">Save schedule</button>
            </form>
          </section>
          <section aria-label="event-history">
            <h2>Event history</h2>
            {eventHistory.length === 0 ? (
              <p>No events loaded.</p>
            ) : (
              <ul>
                {eventHistory.map((eventItem) => (
                  <li key={eventItem.id}>
                    {eventItem.type} · {eventItem.occurred_on}
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
