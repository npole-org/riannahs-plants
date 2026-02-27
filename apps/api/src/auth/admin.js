import { hashPassword, validatePasswordPolicy } from '../core/password.js';
import { parseCreateUserInput, requireAdmin } from '../routes/auth.js';
import { json } from '../http/json.js';

export async function createUserHandler(request, { usersRepo, session }) {
  try {
    requireAdmin(session);
  } catch {
    return json(403, { ok: false, error: 'forbidden' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  let input;
  try {
    input = parseCreateUserInput(payload);
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  if (!validatePasswordPolicy(input.password)) {
    return json(400, { ok: false, error: 'weak_password' });
  }

  const existing = await usersRepo.findByEmail(input.email);
  if (existing) {
    return json(409, { ok: false, error: 'email_exists' });
  }

  const created = await usersRepo.createUser({
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role,
    createdAt: new Date().toISOString()
  });

  return json(201, { ok: true, user: created });
}
