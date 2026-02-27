import { createHealthHandler } from './health.js';

const health = createHealthHandler();

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json(health(), { status: 200 });
    }

    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }
};
