import { describe, expect, test } from 'vitest';
import { dueTasksHandler, recordPlantEventHandler } from '../src/schedule/handlers.js';

describe('schedule handlers', () => {
  test('due tasks requires auth', async () => {
    const res = await dueTasksHandler({ scheduleRepo: {}, session: null });
    expect(res.status).toBe(401);
  });

  test('due tasks flattens due water/repot items', async () => {
    const scheduleRepo = {
      listDueTasksByOwner: async () => [
        { id: 'p1', nickname: 'Monstera', next_water_on: '2026-02-27', next_repot_on: null },
        { id: 'p2', nickname: 'Pothos', next_water_on: '2026-02-20', next_repot_on: '2026-02-27' }
      ]
    };

    const res = await dueTasksHandler({
      scheduleRepo,
      session: { userId: 'u1' },
      now: new Date('2026-02-27T10:00:00Z')
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.tasks).toHaveLength(3);
  });

  test('record event rejects invalid json', async () => {
    const req = new Request('http://local/plants/p1/events', { method: 'POST', body: '{' });
    const res = await recordPlantEventHandler(req, {
      scheduleRepo: {},
      session: { userId: 'u1' },
      plantId: 'p1'
    });
    expect(res.status).toBe(400);
  });

  test('record event rejects invalid payload', async () => {
    const req = new Request('http://local/plants/p1/events', {
      method: 'POST',
      body: JSON.stringify({ type: 'feed', occurred_on: '2026-02-27' })
    });

    const res = await recordPlantEventHandler(req, {
      scheduleRepo: {},
      session: { userId: 'u1' },
      plantId: 'p1'
    });

    expect(res.status).toBe(400);
  });

  test('record event returns 404 when plant missing', async () => {
    const scheduleRepo = {
      recordPlantEvent: async () => {
        throw new Error('plant_not_found');
      }
    };

    const req = new Request('http://local/plants/p1/events', {
      method: 'POST',
      body: JSON.stringify({ type: 'water', occurred_on: '2026-02-27' })
    });

    const res = await recordPlantEventHandler(req, {
      scheduleRepo,
      session: { userId: 'u1' },
      plantId: 'p1'
    });

    expect(res.status).toBe(404);
  });
});
