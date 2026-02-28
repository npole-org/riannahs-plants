import { describe, expect, test } from 'vitest';
import { createSessionCookie } from '../src/auth/session.js';

describe('session cookie', () => {
  test('includes secure cookie attributes', () => {
    const cookie = createSessionCookie('abc123');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('__Host-rp_session=abc123');
  });
});
