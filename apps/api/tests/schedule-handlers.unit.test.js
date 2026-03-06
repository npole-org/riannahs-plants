import { describe, expect, test } from 'vitest';
import { configureScheduleHandler, dueTasksHandler, plantEventHistoryHandler, recordPlantEventHandler } from '../src/schedule/handlers.js';

describe('schedule handlers', () => {
  test('due tasks returns public tasks without auth', async () => {
    const scheduleRepo = {
      listDueTasksPublic: async () => [{ id: 'p1', nickname: 'Monstera', next_water_on: '2026-02-27', next_repot_on: null }]
    };
    const res = await dueTasksHandler({ scheduleRepo, session: null, now: new Date('2026-02-27T10:00:00Z') });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
    expect(body.tasks).toHaveLength(1);
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

  test('event history returns public events without auth', async () => {
    const scheduleRepo = {
      listPlantEventsPublic: async () => [{ id: 'e-public', type: 'water' }]
    };
    const res = await plantEventHistoryHandler({ scheduleRepo, session: null, plantId: 'p1' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
    expect(body.events).toHaveLength(1);
  });

  test('event history returns owner events', async () => {
    const scheduleRepo = {
      listPlantEvents: async () => [{ id: 'e1', type: 'water' }]
    };

    const res = await plantEventHistoryHandler({ scheduleRepo, session: { userId: 'u1' }, plantId: 'p1' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toHaveLength(1);
  });

  test('configure schedule rejects invalid json', async () => {
    const req = new Request('http://local/plants/p1/schedule', { method: 'PUT', body: '{' });
    const res = await configureScheduleHandler(req, { scheduleRepo: {}, session: { userId: 'u1' }, plantId: 'p1' });
    expect(res.status).toBe(400);
  });

  test('configure schedule handles plant not found', async () => {
    const scheduleRepo = {
      configurePlantSchedule: async () => {
        throw new Error('plant_not_found');
      }
    };

    const req = new Request('http://local/plants/p1/schedule', {
      method: 'PUT',
      body: JSON.stringify({ next_water_on: '2026-03-01' })
    });

    const res = await configureScheduleHandler(req, { scheduleRepo, session: { userId: 'u1' }, plantId: 'p1' });
    expect(res.status).toBe(404);
  });

  test('configure schedule updates due fields', async () => {
    const scheduleRepo = {
      configurePlantSchedule: async () => ({ plant_id: 'p1', next_water_on: '2026-03-01', next_repot_on: null })
    };

    const req = new Request('http://local/plants/p1/schedule', {
      method: 'PUT',
      body: JSON.stringify({ next_water_on: '2026-03-01' })
    });

    const res = await configureScheduleHandler(req, { scheduleRepo, session: { userId: 'u1' }, plantId: 'p1' });
    expect(res.status).toBe(200);
  });
});
