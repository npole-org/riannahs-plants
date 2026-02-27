import { describe, expect, test } from 'vitest';
import { parseLoginInput, parseCreateUserInput, requireAdmin } from '../src/routes/auth.js';

describe('auth route helpers', () => {
  test('parseLoginInput normalizes email', () => {
    const input = parseLoginInput({ email: '  USER@Example.COM ', password: 'pw' });
    expect(input).toEqual({ email: 'user@example.com', password: 'pw' });
  });

  test('parseCreateUserInput validates role', () => {
    expect(() => parseCreateUserInput({ email: 'a@b.com', password: '123456789012', role: 'owner' })).toThrow('invalid_role');
  });

  test('requireAdmin allows admin', () => {
    expect(() => requireAdmin({ role: 'admin' })).not.toThrow();
  });

  test('requireAdmin blocks non-admin', () => {
    expect(() => requireAdmin({ role: 'user' })).toThrow('forbidden');
  });
});
