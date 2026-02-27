CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','user')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  species_common TEXT,
  species_scientific TEXT,
  acquired_on TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(owner_user_id) REFERENCES users(id)
);
