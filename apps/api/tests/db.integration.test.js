import { describe, expect, test } from 'vitest';

describe('worker + local d1 integration', () => {
  test('health endpoint responds', async () => {
    const res = await fetch('http://127.0.0.1:8788/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('db health confirms users table exists after migration', async () => {
    const res = await fetch('http://127.0.0.1:8788/health/db');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.table).toBe('users');
  });
});
