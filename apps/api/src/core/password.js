import crypto from 'node:crypto';

const DEFAULT_ITERATIONS = 100000;
const KEYLEN = 32;
const DIGEST = 'sha256';

export function hashPassword(password, { iterations = DEFAULT_ITERATIONS } = {}) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, iterations, KEYLEN, DIGEST).toString('hex');
  return `pbkdf2$${iterations}$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  const [scheme, iterStr, salt, expected] = String(stored).split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !salt || !expected) return false;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const actual = crypto.pbkdf2Sync(password, salt, iterations, KEYLEN, DIGEST).toString('hex');
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function validatePasswordPolicy(password) {
  return typeof password === 'string' && password.length >= 12;
}
