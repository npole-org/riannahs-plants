import { parseLoginInput } from '../routes/auth.js';
import { verifyPassword } from '../core/password.js';
import { clearSessionCookie, createSessionCookie, toBase64Url } from './session.js';
import { json } from '../http/json.js';

export async function loginHandler(request, { usersRepo }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  let email;
  let password;
  try {
    ({ email, password } = parseLoginInput(payload));
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  const user = await usersRepo.findByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(401, { ok: false, error: 'invalid_credentials' });
  }

  const session = JSON.stringify({ userId: user.id, role: user.role, email: user.email });
  return json(200, { ok: true, role: user.role }, { 'set-cookie': createSessionCookie(toBase64Url(session)) });
}

export function logoutHandler() {
  return json(200, { ok: true }, { 'set-cookie': clearSessionCookie() });
}
