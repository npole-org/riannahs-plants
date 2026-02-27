import { parseLoginInput } from '../routes/auth.js';
import { verifyPassword } from '../core/password.js';
import { createSessionCookie } from './session.js';

export async function loginHandler(request, { usersRepo }) {
  const payload = await request.json();
  const { email, password } = parseLoginInput(payload);

  const user = await usersRepo.findByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_credentials' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const session = JSON.stringify({ userId: user.id, role: user.role, email: user.email });
  return new Response(JSON.stringify({ ok: true, role: user.role }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': createSessionCookie(Buffer.from(session).toString('base64url'))
    }
  });
}

export function logoutHandler() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': 'rp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  });
}
