CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  token_version INTEGER NOT NULL DEFAULT 0,
  avatar_data TEXT,
  avatar_mime TEXT CHECK (avatar_mime IN ('image/png', 'image/jpeg', 'image/webp') OR avatar_mime IS NULL),
  avatar_updated_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  otp_digest TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  reset_token_digest TEXT,
  reset_token_expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_page_permissions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL CHECK (page_key IN ('home', 'about', 'contact')),
  can_view INTEGER NOT NULL DEFAULT 0 CHECK (can_view IN (0, 1)),
  can_edit INTEGER NOT NULL DEFAULT 0 CHECK (can_edit IN (0, 1)),
  can_update INTEGER NOT NULL DEFAULT 0 CHECK (can_update IN (0, 1)),
  PRIMARY KEY (user_id, page_key),
  CHECK (can_edit = 0 OR can_view = 1),
  CHECK (can_update = 0 OR (can_edit = 1 AND can_view = 1))
);
