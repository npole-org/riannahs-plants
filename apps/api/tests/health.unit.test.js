import { describe, test, expect } from 'vitest';
import { createHealthHandler } from '../src/health.js';

describe('createHealthHandler', () => {
  test('returns expected health payload', () => {
    const health = createHealthHandler({ now: () => '2026-02-27T18:00:00.000Z' });

    expect(health()).toEqual({
      ok: true,
      service: 'riannahs-plants-api',
      timestamp: '2026-02-27T18:00:00.000Z'
    });
  });
});
