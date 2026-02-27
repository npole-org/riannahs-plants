import { createHealthHandler } from './health.js';

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json(health(), { status: 200 });
    }

    if (url.pathname === '/health/db') {
      return Response.json(await checkDatabase(env.DB), { status: 200 });
    }

    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }
};
