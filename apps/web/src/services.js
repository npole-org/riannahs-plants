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
        fetchImpl('/plants', { method: 'GET', credentials: 'include' }),
        fetchImpl('/tasks/due', { method: 'GET', credentials: 'include' })
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

export function createAuthService(fetchImpl = fetch) {
  return {
    async login({ email, password }) {
      const response = await fetchImpl('/auth/login', {
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

    async logout() {
      const response = await fetchImpl('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('logout_failed');
      }

      return response.json();
    }
  };
}

export const summaryService = createSummaryService();
export const authService = createAuthService();
