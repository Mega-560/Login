import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const databasePath = resolve(process.env.DATABASE_PATH ?? 'data/auth.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })

export const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')
database.exec(readFileSync(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8'))

if (!database.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'role'").get()) {
  database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))")
}

const userColumns = new Set(
  (database.prepare("SELECT name FROM pragma_table_info('users')").all() as { name: string }[]).map(({ name }) => name),
)
if (!userColumns.has('avatar_data')) database.exec('ALTER TABLE users ADD COLUMN avatar_data TEXT')
if (!userColumns.has('avatar_mime')) {
  database.exec("ALTER TABLE users ADD COLUMN avatar_mime TEXT CHECK (avatar_mime IN ('image/png', 'image/jpeg', 'image/webp') OR avatar_mime IS NULL)")
}
if (!userColumns.has('avatar_updated_at')) database.exec('ALTER TABLE users ADD COLUMN avatar_updated_at INTEGER')

export interface AuthUser {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'user' | 'admin'
  token_version: number
  avatar_mime: string | null
  avatar_updated_at: number | null
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: number
}

export const clientPageKeys = ['home', 'about', 'contact'] as const
export type ClientPageKey = typeof clientPageKeys[number]

export interface PagePermission {
  view: boolean
  edit: boolean
  update: boolean
}

export type UserPagePermissions = Record<ClientPageKey, PagePermission>

const listUserPagePermissions = database.prepare<[number], {
  page_key: ClientPageKey
  can_view: number
  can_edit: number
  can_update: number
}>(
  'SELECT page_key, can_view, can_edit, can_update FROM user_page_permissions WHERE user_id = ?',
)

export function getUserPagePermissions(userId: number): UserPagePermissions {
  const permissions: UserPagePermissions = {
    home: { view: true, edit: false, update: false },
    about: { view: true, edit: false, update: false },
    contact: { view: true, edit: false, update: false },
  }
  for (const row of listUserPagePermissions.all(userId)) {
    permissions[row.page_key] = {
      view: row.can_view === 1,
      edit: row.can_edit === 1,
      update: row.can_update === 1,
    }
  }
  return permissions
}

export const saveUserPagePermissions = database.transaction(
  (userId: number, permissions: UserPagePermissions) => {
    const save = database.prepare(`
      INSERT INTO user_page_permissions (user_id, page_key, can_view, can_edit, can_update)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, page_key) DO UPDATE SET
        can_view = excluded.can_view,
        can_edit = excluded.can_edit,
        can_update = excluded.can_update
    `)
    for (const pageKey of clientPageKeys) {
      const permission = permissions[pageKey]
      save.run(userId, pageKey, Number(permission.view), Number(permission.edit), Number(permission.update))
    }
  },
)

export const findUserByEmail = database.prepare<[string], AuthUser>(
  'SELECT id, name, email, password_hash, role, token_version, avatar_mime, avatar_updated_at FROM users WHERE email = ?',
)

export const findUserById = database.prepare<[number], AuthUser>(
  'SELECT id, name, email, password_hash, role, token_version, avatar_mime, avatar_updated_at FROM users WHERE id = ?',
)

export const findUserAvatar = database.prepare<[number], { avatar_data: string | null; avatar_mime: string | null }>(
  'SELECT avatar_data, avatar_mime FROM users WHERE id = ?',
)

export const updateOwnProfile = database.transaction(
  (name: string, email: string, id: number, previousEmail: string) => {
    database.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id)
    if (email.toLowerCase() !== previousEmail.toLowerCase()) {
      database.prepare('DELETE FROM password_resets WHERE email = ?').run(previousEmail)
    }
  },
)

export const updateUserAvatar = database.prepare(
  'UPDATE users SET avatar_data = ?, avatar_mime = ?, avatar_updated_at = ? WHERE id = ?',
)

export const deleteUserAvatar = database.prepare(
  'UPDATE users SET avatar_data = NULL, avatar_mime = NULL, avatar_updated_at = NULL WHERE id = ?',
)

export const createUser = database.prepare(
  'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
)

export const listAdminUsers = database.prepare<[], AdminUser>(
  'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC',
)

export const updateAdminUser = database.transaction(
  (id: number, name: string, email: string, previousEmail: string) => {
    database.prepare(
      'UPDATE users SET name = ?, email = ?, token_version = token_version + 1 WHERE id = ?',
    ).run(name, email, id)
    if (email.toLowerCase() !== previousEmail.toLowerCase()) {
      database.prepare('DELETE FROM password_resets WHERE email = ?').run(previousEmail)
    }
  },
)

export const updatePassword = database.prepare(
  'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
)

export const incrementTokenVersion = database.prepare(
  'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
)

export const upsertPasswordReset = database.prepare(`
  INSERT INTO password_resets (email, otp_digest, expires_at, attempts, reset_token_digest, reset_token_expires_at)
  VALUES (?, ?, ?, 0, NULL, NULL)
  ON CONFLICT(email) DO UPDATE SET
    otp_digest = excluded.otp_digest,
    expires_at = excluded.expires_at,
    attempts = 0,
    reset_token_digest = NULL,
    reset_token_expires_at = NULL
`)

export const findPasswordReset = database.prepare<[string], {
  email: string
  otp_digest: string
  expires_at: number
  attempts: number
  reset_token_digest: string | null
  reset_token_expires_at: number | null
}>(
  `SELECT email, otp_digest, expires_at, attempts, reset_token_digest, reset_token_expires_at
   FROM password_resets WHERE email = ?`,
)

export const incrementPasswordResetAttempts = database.prepare(
  'UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?',
)

export const deletePasswordReset = database.prepare(
  'DELETE FROM password_resets WHERE email = ?',
)

export const issuePasswordResetToken = database.prepare(
  `UPDATE password_resets
   SET otp_digest = '', reset_token_digest = ?, reset_token_expires_at = ?
   WHERE email = ?`,
)

export const completePasswordReset = database.transaction(
  (email: string, userId: number, passwordHash: string) => {
    updatePassword.run(passwordHash, userId)
    deletePasswordReset.run(email)
  },
)
