export function createHealthHandler({ now = () => new Date().toISOString() } = {}) {
  return function health() {
    return {
      ok: true,
      service: 'riannahs-plants-api',
      timestamp: now()
    };
  };
}
