import { describe, expect, test } from 'vitest';
import { hashPassword } from '../src/core/password.js';
import worker from '../src/index.js';
import { toBase64Url } from '../src/auth/session.js';

function adminCookie() {
  const session = JSON.stringify({ userId: 'admin1', role: 'admin', email: 'admin@example.com' });
  return `rp_session=${toBase64Url(session)}`;
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
    expect(res.headers.get('set-cookie')).toContain('rp_session=');
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
});
