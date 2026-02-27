import { createHealthHandler } from './health.js';
import { json } from './http/json.js';
import { loginHandler, logoutHandler } from './auth/login.js';
import { createUsersRepo } from './db/users.js';

const health = createHealthHandler();

async function checkDatabase(db) {
  if (!db) {
    return { ok: false, error: 'db_not_bound' };
  }

  try {
    const result = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").first();
    return { ok: Boolean(result?.name), table: result?.name ?? null };
  } catch {
    return { ok: false, error: 'db_query_failed' };
  }
}

function notFound() {
  return json(404, { ok: false, error: 'not_found' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json(200, health());
    }

    if (url.pathname === '/health/db') {
      return json(200, await checkDatabase(env.DB));
    }

    if (url.pathname === '/auth/login' && request.method === 'POST') {
      return loginHandler(request, { usersRepo: createUsersRepo(env.DB) });
    }

    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return logoutHandler();
    }

    return notFound();
  }
};
