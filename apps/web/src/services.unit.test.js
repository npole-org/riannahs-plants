import { describe, expect, test, vi } from 'vitest';
import { createAuthService, createPlantService, createSummaryService } from './services';

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

  test('handles missing plants/tasks payload fields', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, tasks: [{ nickname: 'x' }] }) });
    const summaryService = createSummaryService(fetchImpl);
    await expect(summaryService.getSummary()).resolves.toEqual({ plants: 0, dueToday: 0, upcoming: 0, tasks: [{ nickname: 'x' }] });
  });

  test('throws when summary fetch fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, tasks: [] }) });
    const summaryService = createSummaryService(fetchImpl);
    await expect(summaryService.getSummary()).rejects.toThrow('dashboard_load_failed');
  });
});

describe('plantService', () => {
  test('lists plants', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ plants: [{ id: 'p1' }] }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.listPlants()).resolves.toEqual([{ id: 'p1' }]);
  });

  test('creates plant', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ plant: { id: 'p1', nickname: 'Pothos' } }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.createPlant({ nickname: 'Pothos' })).resolves.toEqual({ id: 'p1', nickname: 'Pothos' });
  });

  test('updates plant', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ plant: { id: 'p1', nickname: 'Updated' } }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.updatePlant('p1', { nickname: 'Updated' })).resolves.toEqual({ id: 'p1', nickname: 'Updated' });
  });

  test('deletes plant', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.deletePlant('p1')).resolves.toEqual({ ok: true });
  });

  test('throws on list failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'unauthorized' }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.listPlants()).rejects.toThrow('unauthorized');
  });

  test('uses default list failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.listPlants()).rejects.toThrow('plants_load_failed');
  });

  test('throws on create failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'missing_nickname' }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.createPlant({})).rejects.toThrow('missing_nickname');
  });

  test('uses default create failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.createPlant({})).rejects.toThrow('plant_create_failed');
  });

  test('throws on update failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'plant_not_found' }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.updatePlant('p1', { nickname: 'X' })).rejects.toThrow('plant_not_found');
  });

  test('uses default update failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.updatePlant('p1', { nickname: 'X' })).rejects.toThrow('plant_update_failed');
  });

  test('throws on delete failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'plant_not_found' }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.deletePlant('p1')).rejects.toThrow('plant_not_found');
  });

  test('uses default delete failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.deletePlant('p1')).rejects.toThrow('plant_delete_failed');
  });

  test('configures schedule', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ schedule: { plant_id: 'p1' } }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.configureSchedule('p1', { next_water_on: '2026-03-01' })).resolves.toEqual({ plant_id: 'p1' });
  });

  test('lists event history', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ events: [{ id: 'e1' }] }) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.listEvents('p1')).resolves.toEqual([{ id: 'e1' }]);
  });

  test('uses default schedule config failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.configureSchedule('p1', {})).rejects.toThrow('schedule_config_failed');
  });

  test('uses default event history failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const plantService = createPlantService(fetchImpl);
    await expect(plantService.listEvents('p1')).rejects.toThrow('event_history_failed');
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

  test('throws payload error on login failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'invalid_credentials' }) }));
    const authService = createAuthService(fetchImpl);
    await expect(authService.login({ email: 'x', password: 'y' })).rejects.toThrow('invalid_credentials');
  });

  test('uses default login failure message', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const authService = createAuthService(fetchImpl);
    await expect(authService.login({ email: 'x', password: 'y' })).rejects.toThrow('login_failed');
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

  test('throws on logout failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    const authService = createAuthService(fetchImpl);
    await expect(authService.logout()).rejects.toThrow('logout_failed');
  });
});
