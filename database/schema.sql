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

CREATE TABLE IF NOT EXISTS catalogue_parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  warranty TEXT NOT NULL,
  image TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  description TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS catalogue_parts_active_category_idx
  ON catalogue_parts (active, category, name);

CREATE TABLE IF NOT EXISTS catalogue_manual_categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES catalogue_manual_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS catalogue_manuals (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES catalogue_manual_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf' CHECK (mime_type = 'application/pdf'),
  data BLOB NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS business_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dealer', 'retailer')),
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS business_partners_type_active_idx
  ON business_partners (type, active, name);

CREATE TABLE IF NOT EXISTS customer_orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  shipping_status TEXT NOT NULL DEFAULT 'not_shipped' CHECK (shipping_status IN ('not_shipped', 'preparing', 'shipped', 'in_transit', 'delivered', 'exception')),
  shipping_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery TEXT,
  partner_id TEXT REFERENCES business_partners(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL DEFAULT 'due' CHECK (payment_status IN ('due', 'paid', 'refunded')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  subtotal REAL NOT NULL CHECK (subtotal >= 0),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS customer_orders_user_created_idx
  ON customer_orders (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  part_id TEXT NOT NULL,
  part_name TEXT NOT NULL,
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS customer_order_items_order_idx
  ON customer_order_items (order_id);
