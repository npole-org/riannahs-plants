import { createHealthHandler } from './health.js';
import { json } from './http/json.js';
import { loginHandler, logoutHandler } from './auth/login.js';
import { createUsersRepo } from './db/users.js';
import { createUserHandler } from './auth/admin.js';
import { readSessionFromCookie } from './auth/session.js';
import { createPlantsRepo } from './db/plants.js';
import { createPlantHandler, deletePlantHandler, listPlantsHandler, updatePlantHandler } from './plants/handlers.js';
import { createScheduleRepo } from './db/schedule.js';
import { configureScheduleHandler, dueTasksHandler, plantEventHistoryHandler, recordPlantEventHandler } from './schedule/handlers.js';

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

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) {
    return null;
  }

  const configuredOrigins = String(env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const defaultOrigins = ['https://riannahs-plants-develop.pages.dev', 'http://localhost:5173'];
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

  if (!allowedOrigins.includes(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    Vary: 'Origin'
  };
}

function withCors(response, corsHeaders) {
  if (!corsHeaders) {
    return response;
  }

  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request, env);
    const respond = (response) => withCors(response, corsHeaders);

    if (request.method === 'OPTIONS') {
      return respond(new Response(null, { status: 204 }));
    }

    if (url.pathname === '/health') {
      return respond(json(200, health()));
    }

    if (url.pathname === '/health/db') {
      return respond(json(200, await checkDatabase(env.DB)));
    }

    const usersRepo = createUsersRepo(env.DB);
    const plantsRepo = createPlantsRepo(env.DB);
    const scheduleRepo = createScheduleRepo(env.DB);
    const session = readSessionFromCookie(request.headers.get('cookie'));

    if (url.pathname === '/auth/login' && request.method === 'POST') {
      return respond(await loginHandler(request, { usersRepo }));
    }

    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return respond(logoutHandler());
    }

    if (url.pathname === '/admin/users' && request.method === 'POST') {
      return respond(await createUserHandler(request, { usersRepo, session }));
    }

    if (url.pathname === '/plants' && request.method === 'GET') {
      return respond(await listPlantsHandler({ plantsRepo, session }));
    }

    if (url.pathname === '/plants' && request.method === 'POST') {
      return respond(await createPlantHandler(request, { plantsRepo, session }));
    }

    const plantMatch = url.pathname.match(/^\/plants\/([^/]+)$/);
    if (plantMatch && request.method === 'PUT') {
      return respond(await updatePlantHandler(request, { plantsRepo, session, plantId: plantMatch[1] }));
    }

    if (plantMatch && request.method === 'DELETE') {
      return respond(await deletePlantHandler({ plantsRepo, session, plantId: plantMatch[1] }));
    }

    if (url.pathname === '/tasks/due' && request.method === 'GET') {
      return respond(await dueTasksHandler({ scheduleRepo, session }));
    }

    const plantEventMatch = url.pathname.match(/^\/plants\/([^/]+)\/events$/);
    if (plantEventMatch && request.method === 'POST') {
      return respond(await recordPlantEventHandler(request, {
        scheduleRepo,
        session,
        plantId: plantEventMatch[1]
      }));
    }

    if (plantEventMatch && request.method === 'GET') {
      return respond(await plantEventHistoryHandler({
        scheduleRepo,
        session,
        plantId: plantEventMatch[1]
      }));
    }

    const plantScheduleMatch = url.pathname.match(/^\/plants\/([^/]+)\/schedule$/);
    if (plantScheduleMatch && request.method === 'PUT') {
      return respond(await configureScheduleHandler(request, {
        scheduleRepo,
        session,
        plantId: plantScheduleMatch[1]
      }));
    }

    return respond(notFound());
  }
};
