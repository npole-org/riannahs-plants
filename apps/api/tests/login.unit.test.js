import { describe, expect, test } from 'vitest';
import { hashPassword } from '../src/core/password.js';
import { loginHandler, logoutHandler } from '../src/auth/login.js';

describe('auth login/logout handlers', () => {
  test('login returns 200 and cookie for valid credentials', async () => {
    const password_hash = hashPassword('123456789012');
    const request = new Request('http://local/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: '123456789012' })
    });

    const usersRepo = {
      async findByEmail(email) {
        return { id: 'u1', email, role: 'admin', password_hash };
      }
    };

    const res = await loginHandler(request, { usersRepo });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('__Host-rp_session=');
  });

  test('login returns 401 for invalid credentials', async () => {
    const request = new Request('http://local/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' })
    });

    const usersRepo = {
      async findByEmail(email) {
        return { id: 'u1', email, role: 'admin', password_hash: hashPassword('123456789012') };
      }
    };

    const res = await loginHandler(request, { usersRepo });
    expect(res.status).toBe(401);
  });

  test('login returns 400 for invalid email input', async () => {
    const request = new Request('http://local/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: '123456789012' })
    });

    const usersRepo = {
      async findByEmail() {
        throw new Error('should_not_be_called');
      }
    };

    const res = await loginHandler(request, { usersRepo });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_email');
  });

  test('logout clears session cookie', () => {
    const res = logoutHandler();
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
