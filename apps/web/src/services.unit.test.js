import { describe, expect, test, vi } from 'vitest';
import { createAuthService, createSummaryService } from './services';

describe('summaryService', () => {
  test('returns default summary payload', async () => {
    const summaryService = createSummaryService();

    await expect(summaryService.getSummary()).resolves.toEqual({
      plants: 0,
      dueToday: 0
    });
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
});
