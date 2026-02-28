export function parseLoginInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    throw new Error('missing_credentials');
  }

  return { email, password };
}

export function parseCreateUserInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = String(body.role ?? '').trim().toLowerCase();

  if (!email || !password || !role) {
    throw new Error('missing_fields');
  }

  if (!['admin', 'user'].includes(role)) {
    throw new Error('invalid_role');
  }

  return { email, password, role };
}

export function requireAdmin(session) {
  if (!session || session.role !== 'admin') {
    throw new Error('forbidden');
  }
}
