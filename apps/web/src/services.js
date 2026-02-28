function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return path;
  return `${String(base).replace(/\/$/, '')}${path}`;
}

function classifyTasks(tasks = [], todayIsoDate = new Date().toISOString().slice(0, 10)) {
  let dueToday = 0;
  let upcoming = 0;

  for (const task of tasks) {
    if (!task?.due_on) continue;
    if (task.due_on <= todayIsoDate) {
      dueToday += 1;
    } else {
      upcoming += 1;
    }
  }

  return { dueToday, upcoming };
}

export function createSummaryService(fetchImpl = fetch) {
  return {
    async getSummary() {
      const [plantsResponse, dueResponse] = await Promise.all([
        fetchImpl(apiUrl('/plants'), { method: 'GET', credentials: 'include' }),
        fetchImpl(apiUrl('/tasks/due'), { method: 'GET', credentials: 'include' })
      ]);

      const plantsPayload = await plantsResponse.json();
      const duePayload = await dueResponse.json();

      if (!plantsResponse.ok || !dueResponse.ok) {
        throw new Error('dashboard_load_failed');
      }

      const tasks = duePayload.tasks || [];
      const buckets = classifyTasks(tasks);

      return {
        plants: (plantsPayload.plants || []).length,
        dueToday: buckets.dueToday,
        upcoming: buckets.upcoming,
        tasks
      };
    }
  };
}

export function createPlantService(fetchImpl = fetch) {
  return {
    async listPlants() {
      const response = await fetchImpl(apiUrl('/plants'), { method: 'GET', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'plants_load_failed');
      return payload.plants || [];
    },

    async createPlant(input) {
      const response = await fetchImpl(apiUrl('/plants'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'plant_create_failed');
      return payload.plant;
    },

    async updatePlant(id, input) {
      const response = await fetchImpl(apiUrl(`/plants/${id}`), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'plant_update_failed');
      return payload.plant;
    },

    async deletePlant(id) {
      const response = await fetchImpl(apiUrl(`/plants/${id}`), { method: 'DELETE', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'plant_delete_failed');
      return payload;
    },

    async configureSchedule(id, { next_water_on, next_repot_on }) {
      const response = await fetchImpl(apiUrl(`/plants/${id}/schedule`), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ next_water_on, next_repot_on })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'schedule_config_failed');
      return payload.schedule;
    },

    async listEvents(id) {
      const response = await fetchImpl(apiUrl(`/plants/${id}/events`), { method: 'GET', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'event_history_failed');
      return payload.events || [];
    }
  };
}

export function createAuthService(fetchImpl = fetch) {
  return {
    async login({ email, password }) {
      const response = await fetchImpl(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'login_failed');
      }

      return payload;
    },

    async me() {
      const response = await fetchImpl(apiUrl('/auth/me'), {
        method: 'GET',
        credentials: 'include'
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'unauthorized');
      }
      return payload.user;
    },

    async logout() {
      const response = await fetchImpl(apiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('logout_failed');
      }

      return response.json();
    },

    async createUser({ email, password, role = 'user' }) {
      const response = await fetchImpl(apiUrl('/admin/users'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'user_create_failed');
      }
      return payload.user;
    }
  };
}

export const summaryService = createSummaryService();
export const plantService = createPlantService();
export const authService = createAuthService();
