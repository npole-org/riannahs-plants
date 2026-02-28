import { describe, expect, test } from 'vitest';
import { parseLoginInput, parseCreateUserInput, requireAdmin } from '../src/routes/auth.js';

describe('auth route helpers', () => {
  test('parseLoginInput normalizes email', () => {
    const input = parseLoginInput({ email: '  USER@Example.COM ', password: 'pw' });
    expect(input).toEqual({ email: 'user@example.com', password: 'pw' });
  });

  test('parseLoginInput rejects invalid body', () => {
    expect(() => parseLoginInput(null)).toThrow('invalid_body');
  });

  test('parseLoginInput rejects missing credentials', () => {
    expect(() => parseLoginInput({ email: '', password: '' })).toThrow('missing_credentials');
  });

  test('parseLoginInput rejects invalid email', () => {
    expect(() => parseLoginInput({ email: 'not-an-email', password: 'pw' })).toThrow('invalid_email');
  });

  test('parseLoginInput rejects excessive password length', () => {
    expect(() => parseLoginInput({ email: 'user@example.com', password: 'a'.repeat(1025) })).toThrow('invalid_password_length');
  });

  test('parseCreateUserInput validates role', () => {
    expect(() => parseCreateUserInput({ email: 'a@b.com', password: '123456789012', role: 'owner' })).toThrow('invalid_role');
  });

  test('parseCreateUserInput rejects invalid body', () => {
    expect(() => parseCreateUserInput(undefined)).toThrow('invalid_body');
  });

  test('parseCreateUserInput rejects missing fields', () => {
    expect(() => parseCreateUserInput({ email: 'a@b.com', role: 'user' })).toThrow('missing_fields');
  });

  test('parseCreateUserInput rejects invalid email', () => {
    expect(() => parseCreateUserInput({ email: 'bad-email', password: '123456789012', role: 'user' })).toThrow('invalid_email');
  });

  test('parseCreateUserInput rejects excessive password length', () => {
    expect(() =>
      parseCreateUserInput({ email: 'a@b.com', password: 'a'.repeat(1025), role: 'user' })
    ).toThrow('invalid_password_length');
  });

  test('requireAdmin allows admin', () => {
    expect(() => requireAdmin({ role: 'admin' })).not.toThrow();
  });

  test('requireAdmin blocks non-admin', () => {
    expect(() => requireAdmin({ role: 'user' })).toThrow('forbidden');
  });

  test('requireAdmin blocks missing session', () => {
    expect(() => requireAdmin(null)).toThrow('forbidden');
  });
});
