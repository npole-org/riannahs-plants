const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}

function validatePasswordLength(password) {
  return password.length <= MAX_PASSWORD_LENGTH;
}

export function parseLoginInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    throw new Error('missing_credentials');
  }

  if (!validateEmail(email)) {
    throw new Error('invalid_email');
  }

  if (!validatePasswordLength(password)) {
    throw new Error('invalid_password_length');
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

  if (!validateEmail(email)) {
    throw new Error('invalid_email');
  }

  if (!validatePasswordLength(password)) {
    throw new Error('invalid_password_length');
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
