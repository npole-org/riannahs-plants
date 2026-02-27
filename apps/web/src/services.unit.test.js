import { describe, expect, test, vi } from 'vitest';
import { createAuthService, createSummaryService } from './services';

describe('summaryService', () => {
  test('returns dashboard summary from plants and due tasks endpoints', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, plants: [{ id: 'p1' }, { id: 'p2' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          tasks: [
            { plant_id: 'p1', nickname: 'Monstera', type: 'water', due_on: '2000-01-01' },
            { plant_id: 'p2', nickname: 'Pothos', type: 'repot', due_on: '2999-01-01' }
          ]
        })
      });

    const summaryService = createSummaryService(fetchImpl);

    await expect(summaryService.getSummary()).resolves.toEqual({
      plants: 2,
      dueToday: 1,
      upcoming: 1,
      tasks: [
        { plant_id: 'p1', nickname: 'Monstera', type: 'water', due_on: '2000-01-01' },
        { plant_id: 'p2', nickname: 'Pothos', type: 'repot', due_on: '2999-01-01' }
      ]
    });
  });

  test('ignores tasks without due_on and handles empty payloads', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, plants: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, tasks: [{ plant_id: 'p1' }] }) });

    const summaryService = createSummaryService(fetchImpl);
    await expect(summaryService.getSummary()).resolves.toEqual({ plants: 0, dueToday: 0, upcoming: 0, tasks: [{ plant_id: 'p1' }] });
  });

  test('throws when dashboard fetch fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, tasks: [] }) });

    const summaryService = createSummaryService(fetchImpl);
    await expect(summaryService.getSummary()).rejects.toThrow('dashboard_load_failed');
  });
});

describe('authService', () => {
  test('posts credentials to login endpoint and returns payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, role: 'admin' })
    }));
    const authService = createAuthService(fetchImpl);

    await expect(authService.login({ email: 'admin@example.com', password: '123456789012' })).resolves.toEqual({
      ok: true,
      role: 'admin'
    });

    expect(fetchImpl).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  test('throws login error payload when login fails', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'invalid_credentials' })
    }));
    const authService = createAuthService(fetchImpl);

    await expect(authService.login({ email: 'x', password: 'y' })).rejects.toThrow('invalid_credentials');
  });

  test('posts to logout endpoint', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true })
    }));
    const authService = createAuthService(fetchImpl);

    await expect(authService.logout()).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }));
  });

  test('throws when logout fails', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ ok: false }) }));
    const authService = createAuthService(fetchImpl);

    await expect(authService.logout()).rejects.toThrow('logout_failed');
  });
});
