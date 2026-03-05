import { describe, expect, test } from 'vitest';
import { clearSessionCookie, createSessionCookie } from '../src/auth/session.js';

describe('session cookie', () => {
  test('includes secure cookie attributes', () => {
    const cookie = createSessionCookie('abc123');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=None');
    expect(cookie).toContain('Priority=High');
    expect(cookie).toContain('__Host-rp_session=abc123');
  });

  test('clears cookie with matching hardened attributes', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=None');
    expect(cookie).toContain('Priority=High');
    expect(cookie).toContain('__Host-rp_session=');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });
});
