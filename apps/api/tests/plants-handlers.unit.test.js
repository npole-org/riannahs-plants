import { describe, expect, test } from 'vitest';
import { createPlantHandler, listPlantsHandler } from '../src/plants/handlers.js';

describe('plants handlers', () => {
  test('list returns unauthorized without session', async () => {
    const res = await listPlantsHandler({ plantsRepo: {}, session: null });
    expect(res.status).toBe(401);
  });

  test('list returns owner plants for authenticated session', async () => {
    const plantsRepo = {
      listByOwner: async (ownerUserId) => {
        expect(ownerUserId).toBe('u1');
        return [{ id: 'p1' }];
      }
    };

    const res = await listPlantsHandler({ plantsRepo, session: { userId: 'u1' } });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, plants: [{ id: 'p1' }] });
  });

  test('create returns invalid_json for malformed body', async () => {
    const req = new Request('http://local/plants', { method: 'POST', body: '{' });
    const res = await createPlantHandler(req, { plantsRepo: {}, session: { userId: 'u1' } });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'invalid_json' });
  });

  test('create returns validation error payload', async () => {
    const req = new Request('http://local/plants', { method: 'POST', body: JSON.stringify({ nickname: '' }) });
    const res = await createPlantHandler(req, { plantsRepo: {}, session: { userId: 'u1' } });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'missing_nickname' });
  });
});
