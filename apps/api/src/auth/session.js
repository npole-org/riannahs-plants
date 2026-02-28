const SEVEN_DAYS = 60 * 60 * 24 * 7;

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
  return `rp_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'rp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function readSessionFromCookie(cookieHeader) {
  const value = String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('rp_session='))
    ?.slice('rp_session='.length);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(value));
  } catch {
    return null;
  }
}
