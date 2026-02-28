const SEVEN_DAYS = 60 * 60 * 24 * 7;
const SESSION_COOKIE_NAME = '__Host-rp_session';

export function toBase64Url(value) {
  const base64 = btoa(value);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

export function createSessionCookie(value, { maxAge = SEVEN_DAYS } = {}) {
  return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Priority=High; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Priority=High; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function readSessionFromCookie(cookieHeader) {
  const value = String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(`${SESSION_COOKIE_NAME}=`.length);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(value));
  } catch {
    return null;
  }
}
