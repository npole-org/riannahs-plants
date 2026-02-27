const SEVEN_DAYS = 60 * 60 * 24 * 7;

export function createSessionCookie(value, { maxAge = SEVEN_DAYS } = {}) {
  return `rp_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
