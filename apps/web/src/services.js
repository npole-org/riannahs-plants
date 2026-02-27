export function createSummaryService() {
  return {
    async getSummary() {
      return { plants: 0, dueToday: 0 };
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
