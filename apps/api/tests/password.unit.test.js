import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../src/core/password.js';

describe('password utilities', () => {
  test('hash + verify roundtrip works', () => {
    const hash = hashPassword('very-secure-pass');
    expect(verifyPassword('very-secure-pass', hash)).toBe(true);
    expect(verifyPassword('wrong-pass', hash)).toBe(false);
  });

  test('policy enforces minimum length', () => {
    expect(validatePasswordPolicy('short')).toBe(false);
    expect(validatePasswordPolicy('123456789012')).toBe(true);
  });
});
