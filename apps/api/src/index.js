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

function isCrossSiteStateChangingRequest(request) {
  const method = request.method.toUpperCase();
  const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!unsafeMethods.has(method)) {
    return false;
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    return true;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }

  try {
    return origin !== new URL(request.url).origin;
  } catch {
    return false;
  }
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
  const defaultOrigins = [
    'https://riannahs-plants-develop.pages.dev',
    'https://riannahs-plants.dev.npole.org',
    'https://riannahs-garden.dev.npole.org',
    'https://riannahs-plants.pages.dev',
    'https://riannahs-plants.npole.org',
    'https://riannahs-garden.npole.org',
    'http://localhost:5173'
  ];
  const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

  if (!allowedOrigins.includes(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    Vary: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
  };
}

function buildSecurityHeaders() {
  return {
    Vary: 'Cookie, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), accelerometer=(), autoplay=(), attribution-reporting=(), bluetooth=(), browsing-topics=(), captured-surface-control=(), clipboard-read=(), clipboard-write=(), compute-pressure=(), display-capture=(), encrypted-media=(), fullscreen=(), gamepad=(), gyroscope=(), hid=(), join-ad-interest-group=(), local-fonts=(), magnetometer=(), midi=(), payment=(), picture-in-picture=(), private-state-token-redemption=(), publickey-credentials-get=(), run-ad-auction=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), window-management=(), xr-spatial-tracking=(), idle-detection=(), keyboard-map=(), speaker-selection=(), web-share=(), language-model=(), summarizer=(), translator=(), writer=(), otp-credentials=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'X-Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
    'X-WebKit-CSP': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'X-Download-Options': 'noopen',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-XSS-Protection': '0',
    'Content-Language': 'en',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Surrogate-Control': 'no-store',
    Pragma: 'no-cache',
    Expires: '0'
  };
}

function mergeHeaderList(existingValue, nextValue) {
  const merged = new Set();

  for (const value of [existingValue, nextValue]) {
    if (!value) {
      continue;
    }

    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => merged.add(item));
  }

  return Array.from(merged).join(', ');
}

function withResponseHeaders(response, ...headerSets) {
  const headers = new Headers(response.headers);

  for (const headerSet of headerSets) {
    if (!headerSet) {
      continue;
    }

    Object.entries(headerSet).forEach(([key, value]) => {
      if (key.toLowerCase() === 'vary') {
        headers.set('Vary', mergeHeaderList(headers.get('Vary'), value));
        return;
      }

      headers.set(key, value);
    });
  }

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
    const securityHeaders = buildSecurityHeaders();
    const respond = (response) => withResponseHeaders(response, corsHeaders, securityHeaders);

    if (request.method === 'OPTIONS') {
      return respond(new Response(null, { status: 204 }));
    }

    if (url.pathname === '/health') {
      return respond(json(200, health()));
    }

    if (url.pathname === '/health/db') {
      return respond(json(200, await checkDatabase(env.DB)));
    }

    if (isCrossSiteStateChangingRequest(request)) {
      return respond(json(403, { ok: false, error: 'forbidden' }));
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


    if (url.pathname === '/auth/me' && request.method === 'GET') {
      if (!session) {
        return respond(json(401, { ok: false, error: 'unauthorized' }));
      }
      return respond(json(200, { ok: true, user: { userId: session.userId, role: session.role, email: session.email } }));
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
