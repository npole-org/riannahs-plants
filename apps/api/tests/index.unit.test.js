import { describe, expect, test } from 'vitest';
import { hashPassword } from '../src/core/password.js';
import worker from '../src/index.js';
import { toBase64Url } from '../src/auth/session.js';

function adminCookie() {
  const session = JSON.stringify({ userId: 'admin1', role: 'admin', email: 'admin@example.com' });
  return `__Host-rp_session=${toBase64Url(session)}`;
}

function userCookie() {
  const session = JSON.stringify({ userId: 'user1', role: 'user', email: 'user@example.com' });
  return `__Host-rp_session=${toBase64Url(session)}`;
}

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

  test('routes login endpoint through users repo and sets cookie', async () => {
    const passwordHash = hashPassword('123456789012');
    const db = {
      prepare() {
        return {
          bind() {
            return {
              first: async () => ({
                id: 'u1',
                email: 'admin@example.com',
                role: 'admin',
                password_hash: passwordHash
              })
            };
          }
        };
      }
    };

    const res = await worker.fetch(
      new Request('http://local/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@example.com', password: '123456789012' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('__Host-rp_session=');
  });

  test('logout endpoint clears cookie', async () => {
    const res = await worker.fetch(new Request('http://local/auth/logout', { method: 'POST' }), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  test('admin create-user endpoint enforces admin session', async () => {
    const res = await worker.fetch(
      new Request('http://local/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: '123456789012', role: 'user' })
      }),
      { DB: {} }
    );

    expect(res.status).toBe(403);
  });

  test('admin create-user endpoint creates user for admin session', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('SELECT')) {
          return {
            bind() {
              return {
                first: async () => null
              };
            }
          };
        }

        if (sql.startsWith('INSERT')) {
          return {
            bind() {
              return {
                run: async () => ({ success: true })
              };
            }
          };
        }

        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(
      new Request('http://local/admin/users', {
        method: 'POST',
        headers: { cookie: adminCookie() },
        body: JSON.stringify({ email: 'user@example.com', password: '123456789012', role: 'user' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user.email).toBe('user@example.com');
    expect(body.user.role).toBe('user');
  });

  test('plants endpoints require auth', async () => {
    const res = await worker.fetch(new Request('http://local/plants'), { DB: {} });
    expect(res.status).toBe(401);
  });

  test('list plants returns scoped records', async () => {
    const db = {
      prepare(sql) {
        if (!sql.startsWith('SELECT id, owner_user_id')) {
          throw new Error('unexpected sql');
        }

        return {
          bind(userId) {
            expect(userId).toBe('user1');
            return {
              all: async () => ({
                results: [{ id: 'p1', owner_user_id: 'user1', nickname: 'Monstera' }]
              })
            };
          }
        };
      }
    };

    const res = await worker.fetch(new Request('http://local/plants', { headers: { cookie: userCookie() } }), { DB: db });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.plants).toHaveLength(1);
  });

  test('create plant persists owner-scoped record', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('INSERT INTO plants')) {
          return {
            bind(...values) {
              expect(values[1]).toBe('user1');
              expect(values[2]).toBe('Pothos');
              return {
                run: async () => ({ success: true })
              };
            }
          };
        }

        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(
      new Request('http://local/plants', {
        method: 'POST',
        headers: { cookie: userCookie() },
        body: JSON.stringify({ nickname: 'Pothos' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.plant.nickname).toBe('Pothos');
    expect(body.plant.owner_user_id).toBe('user1');
  });

  test('tasks due endpoint returns due tasks for authenticated user', async () => {
    const db = {
      prepare(sql) {
        if (!sql.includes('FROM plants')) throw new Error('unexpected sql');
        return {
          bind() {
            return {
              all: async () => ({
                results: [{ id: 'p1', nickname: 'Monstera', next_water_on: '2026-02-27', next_repot_on: null }]
              })
            };
          }
        };
      }
    };

    const res = await worker.fetch(new Request('http://local/tasks/due', { headers: { cookie: userCookie() } }), { DB: db });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.tasks).toHaveLength(1);
  });

  test('plant event endpoint records watering event', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('INSERT INTO plant_events')) {
          return {
            bind() {
              return { run: async () => ({ success: true }) };
            }
          };
        }

        if (sql.startsWith('UPDATE plants SET next_water_on')) {
          return {
            bind() {
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          };
        }

        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(
      new Request('http://local/plants/p1/events', {
        method: 'POST',
        headers: { cookie: userCookie() },
        body: JSON.stringify({ type: 'water', occurred_on: '2026-02-27', next_due_on: '2026-03-05' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.event.type).toBe('water');
  });

  test('update plant endpoint updates owner-scoped record', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('UPDATE plants SET')) {
          return {
            bind() {
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          };
        }
        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(
      new Request('http://local/plants/p1', {
        method: 'PUT',
        headers: { cookie: userCookie() },
        body: JSON.stringify({ nickname: 'Updated Pothos' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.plant.nickname).toBe('Updated Pothos');
  });

  test('delete plant endpoint deletes owner-scoped record', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('DELETE FROM plants')) {
          return {
            bind() {
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          };
        }
        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(new Request('http://local/plants/p1', { method: 'DELETE', headers: { cookie: userCookie() } }), {
      DB: db
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  test('plant events history endpoint lists events', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('SELECT id, plant_id, type')) {
          return {
            bind() {
              return { all: async () => ({ results: [{ id: 'e1', type: 'water' }] }) };
            }
          };
        }
        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(new Request('http://local/plants/p1/events', { method: 'GET', headers: { cookie: userCookie() } }), {
      DB: db
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.events).toHaveLength(1);
  });

  test('plant schedule config endpoint updates due dates', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('UPDATE plants SET next_water_on')) {
          return {
            bind() {
              return { run: async () => ({ meta: { changes: 1 } }) };
            }
          };
        }
        throw new Error('unexpected sql');
      }
    };

    const res = await worker.fetch(
      new Request('http://local/plants/p1/schedule', {
        method: 'PUT',
        headers: { cookie: userCookie() },
        body: JSON.stringify({ next_water_on: '2026-03-03' })
      }),
      { DB: db }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.schedule.next_water_on).toBe('2026-03-03');
  });

  test('adds CORS headers for allowed origins', async () => {
    const res = await worker.fetch(
      new Request('http://local/health', {
        headers: { origin: 'https://riannahs-plants-develop.pages.dev' }
      }),
      {}
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://riannahs-plants-develop.pages.dev');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  test('preflight request returns 204 for configured origin', async () => {
    const res = await worker.fetch(
      new Request('http://local/auth/login', {
        method: 'OPTIONS',
        headers: { origin: 'https://app.example.com' }
      }),
      { CORS_ALLOWED_ORIGINS: 'https://app.example.com' }
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
  });

  test('does not add CORS header for disallowed origins', async () => {
    const res = await worker.fetch(
      new Request('http://local/health', {
        headers: { origin: 'https://evil.example.com' }
      }),
      { CORS_ALLOWED_ORIGINS: 'https://safe.example.com' }
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  test('adds baseline security headers on API responses', async () => {
    const res = await worker.fetch(new Request('http://local/health'), {});

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(res.headers.get('Permissions-Policy')).toContain('geolocation=()');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect(res.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    expect(res.headers.get('X-DNS-Prefetch-Control')).toBe('off');
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(res.headers.get('Origin-Agent-Cluster')).toBe('?1');
    expect(res.headers.get('X-Download-Options')).toBe('noopen');
    expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(res.headers.get('Pragma')).toBe('no-cache');
    expect(res.headers.get('Expires')).toBe('0');
  });

  test('adds HSTS header on API responses', async () => {
    const res = await worker.fetch(new Request('http://local/health'), {});

    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
  });

  test('returns both CORS and security headers when origin is allowed', async () => {
    const res = await worker.fetch(
      new Request('http://local/health', {
        headers: { origin: 'https://riannahs-plants-develop.pages.dev' }
      }),
      {}
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://riannahs-plants-develop.pages.dev');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
