const SEVEN_DAYS = 60 * 60 * 24 * 7;

export function toBase64Url(value) {
  const base64 = btoa(value);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function createSessionCookie(value, { maxAge = SEVEN_DAYS } = {}) {
  return `rp_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'rp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
