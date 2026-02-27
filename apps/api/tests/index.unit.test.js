import { describe, expect, test } from 'vitest';
import worker from '../src/index.js';

describe('worker index', () => {
  test('responds with health on /health', async () => {
    const res = await worker.fetch(new Request('http://local/health'), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('responds with not_found on unknown route', async () => {
    const res = await worker.fetch(new Request('http://local/unknown'), {});
    expect(res.status).toBe(404);
  });

  test('responds with db health on /health/db when DB is bound', async () => {
    const db = {
      prepare() {
        return {
          first: async () => ({ name: 'users' })
        };
      }
    };

    const res = await worker.fetch(new Request('http://local/health/db'), { DB: db });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.table).toBe('users');
  });

  test('db health returns db_not_bound when DB missing', async () => {
    const res = await worker.fetch(new Request('http://local/health/db'), {});
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: 'db_not_bound' });
  });

  test('db health returns db_query_failed when DB query throws', async () => {
    const db = {
      prepare() {
        throw new Error('boom');
      }
    };

    const res = await worker.fetch(new Request('http://local/health/db'), { DB: db });
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: 'db_query_failed' });
  });
});
