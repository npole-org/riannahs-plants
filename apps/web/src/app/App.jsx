import React, { useEffect, useState } from 'react';

const EMPTY_SUMMARY = { plants: 0, dueToday: 0, upcoming: 0, tasks: [] };

function plantUrgency(tasks = []) {
  const today = new Date().toISOString().slice(0, 10);
  const byPlant = new Map();

  for (const task of tasks) {
    if (!task?.plant_id || !task?.due_on) continue;
    const existing = byPlant.get(task.plant_id) || { overdue: 0, dueToday: 0, upcoming: 0 };
    if (task.due_on < today) existing.overdue += 1;
    else if (task.due_on === today) existing.dueToday += 1;
    else existing.upcoming += 1;
    byPlant.set(task.plant_id, existing);
  }

  return byPlant;
}

function urgencyLabel(bucket) {
  if (!bucket) return 'none';
  if (bucket.overdue > 0) return 'overdue';
  if (bucket.dueToday > 0) return 'due today';
  if (bucket.upcoming > 0) return 'upcoming';
  return 'none';
}

function urgencyRank(bucket) {
  if (!bucket) return 4;
  if (bucket.overdue > 0) return 1;
  if (bucket.dueToday > 0) return 2;
  if (bucket.upcoming > 0) return 3;
  return 4;
}

export function App({ summaryService, authService, plantService }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [plants, setPlants] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [sessionBootstrapped, setSessionBootstrapped] = useState(false);
  const [error, setError] = useState('');
  const [newPlantNickname, setNewPlantNickname] = useState('');
  const [newPlantSpeciesCommon, setNewPlantSpeciesCommon] = useState('');
  const [newPlantNotes, setNewPlantNotes] = useState('');
  const [newPlantPicture, setNewPlantPicture] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [nextWaterOn, setNextWaterOn] = useState('');
  const [nextRepotOn, setNextRepotOn] = useState('');
  const [eventHistory, setEventHistory] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [createdUserEmail, setCreatedUserEmail] = useState('');

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


  useEffect(() => {
    let active = true;

    authService.me()
      .then((user) => {
        if (!active) return;
        setRole(user.role);
      })
      .catch(() => {
        if (!active) return;
        setRole(null);
      })
      .finally(() => {
        if (active) setSessionBootstrapped(true);
      });

    return () => {
      active = false;
    };
  }, [authService]);

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
    setCreatedUserEmail('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
  }

  async function onAddPlant(event) {
    event.preventDefault();
    if (!newPlantNickname.trim()) return;

    await plantService.createPlant({
      nickname: newPlantNickname.trim(),
      species_common: newPlantSpeciesCommon.trim() || null,
      notes: [newPlantNotes.trim(), newPlantPicture.trim() ? `picture: ${newPlantPicture.trim()}` : ''].filter(Boolean).join('\n') || null
    });
    setNewPlantNickname('');
    setNewPlantSpeciesCommon('');
    setNewPlantNotes('');
    setNewPlantPicture('');
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

  async function quickLog(plantId, type) {
    await plantService.recordEvent(plantId, type);
    await loadDashboardData();
    if (selectedPlantId === plantId) {
      await loadHistory(plantId);
    }
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

  async function onCreateUser(event) {
    event.preventDefault();
    setError('');
    setCreatedUserEmail('');

    try {
      const createdUser = await authService.createUser({
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole
      });
      setCreatedUserEmail(createdUser.email);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    } catch (createUserError) {
      setError(createUserError.message || 'user_create_failed');
    }
  }

  const urgencyByPlant = plantUrgency(summary.tasks);
  const sortedPlants = [...plants].sort((a, b) => {
    const rankDiff = urgencyRank(urgencyByPlant.get(a.id)) - urgencyRank(urgencyByPlant.get(b.id));
    if (rankDiff !== 0) return rankDiff;
    return a.nickname.localeCompare(b.nickname);
  });

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;
  const selectedPlantTasks = summary.tasks.filter((t) => t.plant_id === selectedPlantId);
  const nextWaterTask = selectedPlantTasks.filter((t) => t.type === 'water').sort((a, b) => a.due_on.localeCompare(b.due_on))[0] || null;
  const nextRepotTask = selectedPlantTasks.filter((t) => t.type === 'repot').sort((a, b) => a.due_on.localeCompare(b.due_on))[0] || null;
  const lastWaterEvent = eventHistory.find((e) => e.type === 'water') || null;
  const lastRepotEvent = eventHistory.find((e) => e.type === 'repot') || null;
  const repotThisWeek = summary.tasks.filter((t) => t.type === 'repot').slice(0, 7);

  return (
    <main className="app-shell">
      <h1>riannah's garden</h1>
      {!sessionBootstrapped ? (
        <section aria-label="session-loading"><p>Restoring session…</p></section>
      ) : !role ? (
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
          {role === 'admin' ? (
            <section aria-label="admin-create-user">
              <h2>Create user</h2>
              <form onSubmit={onCreateUser}>
                <label>
                  User email
                  <input type="email" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} required />
                </label>
                <label>
                  Temporary password
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(event) => setNewUserPassword(event.target.value)}
                    minLength={12}
                    required
                  />
                </label>
                <label>
                  Role
                  <select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <button type="submit">Create user</button>
              </form>
              {createdUserEmail ? <p>Created user: {createdUserEmail}</p> : null}
            </section>
          ) : null}
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
          <section aria-label="repot-week-list">
            <h2>Repot this week</h2>
            {repotThisWeek.length === 0 ? (
              <p>No repot tasks this week.</p>
            ) : (
              <ul>
                {repotThisWeek.map((task) => (
                  <li key={`week:${task.plant_id}:${task.due_on}`}>{task.nickname} · {task.due_on}</li>
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
              <label>
                Species/common name
                <input aria-label="Species/common name" value={newPlantSpeciesCommon} onChange={(event) => setNewPlantSpeciesCommon(event.target.value)} />
              </label>
              <label>
                Picture URL
                <input aria-label="Picture URL" value={newPlantPicture} onChange={(event) => setNewPlantPicture(event.target.value)} />
              </label>
              <label>
                Notes
                <input aria-label="Plant notes" value={newPlantNotes} onChange={(event) => setNewPlantNotes(event.target.value)} />
              </label>
              <button type="submit">Add plant</button>
            </form>
            {plants.length === 0 ? (
              <p>No plants yet.</p>
            ) : (
              <ul>
                {sortedPlants.map((plant) => (
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
                        <span>
                          {plant.nickname} <small>({urgencyLabel(urgencyByPlant.get(plant.id))})</small>
                        </span>
                        <button type="button" onClick={() => startEdit(plant)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removePlant(plant.id)}>
                          Delete
                        </button>
                        <button type="button" onClick={() => loadHistory(plant.id)}>
                          History
                        </button>
                        <button type="button" onClick={() => quickLog(plant.id, 'water')}>
                          Log water
                        </button>
                        <button type="button" onClick={() => quickLog(plant.id, 'repot')}>
                          Log repot
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
          <section aria-label="plant-detail-view">
            <h2>Selected plant detail</h2>
            {!selectedPlant ? (
              <p>Select a plant via History to view details.</p>
            ) : (
              <ul>
                <li>{selectedPlant.nickname}</li>
                <li>Species: {selectedPlant.species_common || 'n/a'}</li>
                <li>Notes: {selectedPlant.notes || 'n/a'}</li>
                <li>Last watered: {lastWaterEvent?.occurred_on || 'n/a'}</li>
                <li>Next water due: {nextWaterTask?.due_on || 'n/a'}</li>
                <li>Last repotted: {lastRepotEvent?.occurred_on || 'n/a'}</li>
                <li>Next repot due: {nextRepotTask?.due_on || 'n/a'}</li>
              </ul>
            )}
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
