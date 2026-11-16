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

const orderColumnsPresent = new Set(
  (database.prepare("SELECT name FROM pragma_table_info('customer_orders')").all() as { name: string }[]).map(({ name }) => name),
)
const orderColumnMigrations: Array<[string, string]> = [
  ['shipping_status', "TEXT NOT NULL DEFAULT 'not_shipped' CHECK (shipping_status IN ('not_shipped', 'preparing', 'shipped', 'in_transit', 'delivered', 'exception'))"],
  ['shipping_carrier', 'TEXT'],
  ['tracking_number', 'TEXT'],
  ['tracking_url', 'TEXT'],
  ['estimated_delivery', 'TEXT'],
  ['partner_id', 'TEXT REFERENCES business_partners(id) ON DELETE SET NULL'],
]
for (const [name, definition] of orderColumnMigrations) {
  if (!orderColumnsPresent.has(name)) database.exec(`ALTER TABLE customer_orders ADD COLUMN ${name} ${definition}`)
}

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

export interface CataloguePart {
  id: string
  name: string
  category: string
  vehicle: string
  price: number
  stock: number
  warranty: string
  image: string
  imageAlt: string
  description: string
  active: boolean
  updatedAt: number
}

export interface CataloguePartInput extends Omit<CataloguePart, 'active' | 'updatedAt'> {}

export interface ManualCategory {
  id: string
  parentId: string | null
  name: string
  createdAt: number
}

export interface CatalogueManual {
  id: string
  categoryId: string
  categoryName: string
  name: string
  size: number
  createdAt: number
}

export interface CatalogueManualFile {
  name: string
  data: Buffer
}

export interface OrderItemInput {
  partId: string
  quantity: number
}

export interface OrderItem {
  partId: string
  partName: string
  unitPrice: number
  quantity: number
}

export interface CustomerOrder {
  id: string
  userId: number
  customerName: string
  customerEmail: string
  shippingAddress: string
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
  shippingStatus: 'not_shipped' | 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'exception'
  shippingCarrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  estimatedDelivery: string | null
  partnerId: string | null
  partnerName: string | null
  partnerType: BusinessPartner['type'] | null
  paymentStatus: 'due' | 'paid' | 'refunded'
  currency: 'USD'
  subtotal: number
  createdAt: number
  items: OrderItem[]
}

export interface BusinessPartner {
  id: string
  name: string
  type: 'dealer' | 'retailer'
  contactName: string
  email: string
  phone: string
  address: string
  notes: string
  active: boolean
  createdAt: number
  updatedAt: number
}

export type BusinessPartnerInput = Omit<BusinessPartner, 'id' | 'active' | 'createdAt' | 'updatedAt'>

export interface OrderLogisticsInput {
  shippingStatus: CustomerOrder['shippingStatus']
  shippingCarrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  estimatedDelivery: string | null
  partnerId: string | null
}

const starterParts: CataloguePartInput[] = [
  { id: 'NF-BRK-2041', name: 'Ceramic brake pad kit', category: 'Braking', vehicle: 'Nexus Sedan 2020–25', price: 89.5, stock: 24, warranty: '24 months', image: '/catalogue/brake-kit.svg', imageAlt: 'Illustration of a vented brake rotor and ceramic brake pad', description: 'Low-dust ceramic compound designed for quiet, consistent everyday braking.' },
  { id: 'NF-WHL-1807', name: '18-inch forged alloy wheel', category: 'Wheels & tyres', vehicle: 'Nexus Sedan / Tourer', price: 329, stock: 8, warranty: '36 months', image: '/catalogue/alloy-wheel.svg', imageAlt: 'Illustration of a silver five-spoke alloy wheel', description: 'Lightweight five-spoke forged wheel with a durable corrosion-resistant finish.' },
  { id: 'NF-FLT-3210', name: 'High-flow air filter', category: 'Filters', vehicle: 'Nexus SUV 2018–25', price: 42, stock: 41, warranty: '12 months', image: '/catalogue/air-filter.svg', imageAlt: 'Illustration of a pleated automotive air filter', description: 'Pleated replacement filter engineered to provide dependable engine air flow.' },
  { id: 'NF-IGN-1104', name: 'Iridium spark plug set', category: 'Ignition', vehicle: 'Nexus Sedan / Hatch', price: 64.95, stock: 17, warranty: '24 months', image: '/catalogue/spark-plug.svg', imageAlt: 'Illustration of an iridium spark plug', description: 'Long-life iridium electrode set for reliable ignition and smooth starts.' },
  { id: 'NF-FLT-2077', name: 'Premium oil filter', category: 'Filters', vehicle: 'Nexus Sedan 2016–25', price: 18.75, stock: 56, warranty: '12 months', image: '/catalogue/oil-filter.svg', imageAlt: 'Illustration of a premium red oil filter', description: 'High-efficiency filtration media helps protect engine components between services.' },
  { id: 'NF-BRK-2093', name: 'Performance brake rotor', category: 'Braking', vehicle: 'Nexus SUV 2021–25', price: 148, stock: 12, warranty: '24 months', image: '/catalogue/brake-kit.svg', imageAlt: 'Illustration of a vented brake rotor and ceramic brake pad', description: 'Vented replacement rotor designed to help manage heat under repeated braking.' },
  { id: 'NF-WHL-1932', name: '17-inch touring alloy wheel', category: 'Wheels & tyres', vehicle: 'Nexus Hatch 2019–24', price: 284, stock: 15, warranty: '36 months', image: '/catalogue/alloy-wheel.svg', imageAlt: 'Illustration of a silver five-spoke alloy wheel', description: 'Comfort-focused alloy wheel with a clean finish for daily touring.' },
  { id: 'NF-IGN-1188', name: 'Long-life iridium spark plug', category: 'Ignition', vehicle: 'Nexus SUV / Tourer', price: 19.5, stock: 32, warranty: '24 months', image: '/catalogue/spark-plug.svg', imageAlt: 'Illustration of an iridium spark plug', description: 'Individual long-life spark plug with a fine-wire iridium tip.' },
]

const saveCataloguePartStatement = database.prepare(`
  INSERT INTO catalogue_parts (id, name, category, vehicle, price, stock, warranty, image, image_alt, description, active, updated_at)
  VALUES (@id, @name, @category, @vehicle, @price, @stock, @warranty, @image, @imageAlt, @description, 1, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    vehicle = excluded.vehicle,
    price = excluded.price,
    stock = excluded.stock,
    warranty = excluded.warranty,
    image = excluded.image,
    image_alt = excluded.image_alt,
    description = excluded.description,
    updated_at = excluded.updated_at
`)

if (database.prepare('SELECT COUNT(*) AS count FROM catalogue_parts').get() &&
  (database.prepare('SELECT COUNT(*) AS count FROM catalogue_parts').get() as { count: number }).count === 0) {
  for (const part of starterParts) {
    saveCataloguePartStatement.run({ ...part, updatedAt: Date.now() })
  }
}

database.prepare(`
  INSERT OR IGNORE INTO catalogue_manual_categories (id, parent_id, name, created_at)
  VALUES ('catalog-root', NULL, 'Catalogue', ?)
`).run(Date.now())
database.prepare(`
  INSERT OR IGNORE INTO catalogue_manual_categories (id, parent_id, name, created_at)
  VALUES ('catalog-manuals', 'catalog-root', 'Catalogue Manuals', ?)
`).run(Date.now())

const cataloguePartColumns = `
  id, name, category, vehicle, price, stock, warranty, image,
  image_alt AS imageAlt, description, active, updated_at AS updatedAt
`
const cataloguePartFromRow = (row: Omit<CataloguePart, 'active' | 'updatedAt'> & {
  active: number
  updatedAt: number
}): CataloguePart => ({ ...row, active: row.active === 1 })

export function listCatalogueParts(includeInactive = false): CataloguePart[] {
  const rows = includeInactive
    ? database.prepare(`SELECT ${cataloguePartColumns} FROM catalogue_parts ORDER BY category, name`).all()
    : database.prepare(`SELECT ${cataloguePartColumns} FROM catalogue_parts WHERE active = 1 ORDER BY category, name`).all()
  return (rows as Array<Parameters<typeof cataloguePartFromRow>[0]>).map(cataloguePartFromRow)
}

export function saveCataloguePart(part: CataloguePartInput): CataloguePart {
  saveCataloguePartStatement.run({ ...part, updatedAt: Date.now() })
  const saved = database.prepare(`SELECT ${cataloguePartColumns} FROM catalogue_parts WHERE id = ?`).get(part.id)
  if (!saved) throw new Error('Saved catalogue part could not be loaded.')
  return cataloguePartFromRow(saved as Parameters<typeof cataloguePartFromRow>[0])
}

export function setCataloguePartActive(id: string, active: boolean): boolean {
  return database.prepare('UPDATE catalogue_parts SET active = ?, updated_at = ? WHERE id = ?')
    .run(Number(active), Date.now(), id).changes === 1
}

const businessPartnerColumns = `
  id, name, type, contact_name AS contactName, email, phone, address, notes,
  active, created_at AS createdAt, updated_at AS updatedAt
`

function businessPartnerFromRow(row: Omit<BusinessPartner, 'active'> & { active: number }): BusinessPartner {
  return { ...row, active: row.active === 1 }
}

export function listBusinessPartners(includeInactive = true): BusinessPartner[] {
  const rows = includeInactive
    ? database.prepare(`SELECT ${businessPartnerColumns} FROM business_partners ORDER BY type, name`).all()
    : database.prepare(`SELECT ${businessPartnerColumns} FROM business_partners WHERE active = 1 ORDER BY type, name`).all()
  return (rows as Array<Parameters<typeof businessPartnerFromRow>[0]>).map(businessPartnerFromRow)
}

export function saveBusinessPartner(id: string, partner: BusinessPartnerInput): BusinessPartner {
  const now = Date.now()
  database.prepare(`
    INSERT INTO business_partners
      (id, name, type, contact_name, email, phone, address, notes, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, type = excluded.type, contact_name = excluded.contact_name,
      email = excluded.email, phone = excluded.phone, address = excluded.address,
      notes = excluded.notes, updated_at = excluded.updated_at
  `).run(id, partner.name, partner.type, partner.contactName, partner.email, partner.phone, partner.address, partner.notes, now, now)
  const saved = database.prepare(`SELECT ${businessPartnerColumns} FROM business_partners WHERE id = ?`).get(id)
  if (!saved) throw new Error('Saved business partner could not be loaded.')
  return businessPartnerFromRow(saved as Parameters<typeof businessPartnerFromRow>[0])
}

export function setBusinessPartnerActive(id: string, active: boolean): boolean {
  return database.prepare('UPDATE business_partners SET active = ?, updated_at = ? WHERE id = ?')
    .run(Number(active), Date.now(), id).changes === 1
}

export function listManualCategories(): ManualCategory[] {
  return database.prepare(`
    SELECT id, parent_id AS parentId, name, created_at AS createdAt
    FROM catalogue_manual_categories
    ORDER BY parent_id IS NOT NULL, name
  `).all() as ManualCategory[]
}

export function createManualCategory(id: string, parentId: string, name: string): ManualCategory {
  database.prepare(`
    INSERT INTO catalogue_manual_categories (id, parent_id, name, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, parentId, name, Date.now())
  return { id, parentId, name, createdAt: Date.now() }
}

export function listCatalogueManuals(): CatalogueManual[] {
  return database.prepare(`
    SELECT manuals.id, manuals.category_id AS categoryId, categories.name AS categoryName,
      manuals.name, manuals.size, manuals.created_at AS createdAt
    FROM catalogue_manuals AS manuals
    JOIN catalogue_manual_categories AS categories ON categories.id = manuals.category_id
    ORDER BY categories.name, manuals.name
  `).all() as CatalogueManual[]
}

export function saveCatalogueManual(id: string, categoryId: string, name: string, data: Buffer): CatalogueManual {
  const createdAt = Date.now()
  database.prepare(`
    INSERT INTO catalogue_manuals (id, category_id, name, data, size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, categoryId, name, data, data.byteLength, createdAt)
  const category = database.prepare('SELECT name FROM catalogue_manual_categories WHERE id = ?').get(categoryId) as { name: string } | undefined
  if (!category) throw new Error('Manual category could not be loaded.')
  return { id, categoryId, categoryName: category.name, name, size: data.byteLength, createdAt }
}

export function getCatalogueManualFile(id: string): CatalogueManualFile | undefined {
  return database.prepare('SELECT name, data FROM catalogue_manuals WHERE id = ?')
    .get(id) as CatalogueManualFile | undefined
}

export function deleteCatalogueManual(id: string): boolean {
  return database.prepare('DELETE FROM catalogue_manuals WHERE id = ?').run(id).changes === 1
}

const readOrderItems = database.prepare<[string], OrderItem>(`
  SELECT part_id AS partId, part_name AS partName, unit_price AS unitPrice, quantity
  FROM customer_order_items WHERE order_id = ?
`)

const orderColumns = `
  orders.id, orders.user_id AS userId, orders.customer_name AS customerName, orders.customer_email AS customerEmail,
  orders.shipping_address AS shippingAddress, orders.status,
  orders.shipping_status AS shippingStatus, orders.shipping_carrier AS shippingCarrier,
  orders.tracking_number AS trackingNumber, orders.tracking_url AS trackingUrl,
  orders.estimated_delivery AS estimatedDelivery, orders.partner_id AS partnerId,
  partners.name AS partnerName, partners.type AS partnerType,
  orders.payment_status AS paymentStatus, orders.currency, orders.subtotal, orders.created_at AS createdAt
`

const orderJoin = 'FROM customer_orders orders LEFT JOIN business_partners partners ON partners.id = orders.partner_id'

function withOrderItems(row: Omit<CustomerOrder, 'items'>): CustomerOrder {
  return { ...row, items: readOrderItems.all(row.id) }
}

export function listCustomerOrders(userId?: number): CustomerOrder[] {
  const rows = userId === undefined
    ? database.prepare(`SELECT ${orderColumns} ${orderJoin} ORDER BY orders.created_at DESC`).all()
    : database.prepare(`SELECT ${orderColumns} ${orderJoin} WHERE orders.user_id = ? ORDER BY orders.created_at DESC`).all(userId)
  return (rows as Array<Omit<CustomerOrder, 'items'>>).map(withOrderItems)
}

export const placeCustomerOrder = database.transaction(
  (order: Pick<CustomerOrder, 'id' | 'userId' | 'customerName' | 'customerEmail' | 'shippingAddress'>, items: OrderItemInput[]) => {
    const inventory = database.prepare('SELECT id, name, price, stock, active FROM catalogue_parts WHERE id = ?')
    const orderItemInsert = database.prepare(`
      INSERT INTO customer_order_items (order_id, part_id, part_name, unit_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `)
    const decrementStock = database.prepare('UPDATE catalogue_parts SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ? AND active = 1')
    const orderItems: OrderItem[] = []
    let subtotal = 0

    for (const item of items) {
      const part = inventory.get(item.partId) as { id: string; name: string; price: number; stock: number; active: number } | undefined
      if (!part || part.active !== 1) throw new Error('A selected part is no longer available.')
      if (item.quantity > part.stock) throw new Error(`${part.name} has only ${part.stock} unit(s) available.`)
      subtotal += part.price * item.quantity
      orderItems.push({ partId: part.id, partName: part.name, unitPrice: part.price, quantity: item.quantity })
    }

    database.prepare(`
      INSERT INTO customer_orders
        (id, user_id, customer_name, customer_email, shipping_address, status, payment_status, currency, subtotal, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 'due', 'USD', ?, ?)
    `).run(order.id, order.userId, order.customerName, order.customerEmail, order.shippingAddress, subtotal, Date.now())

    for (const item of orderItems) {
      const result = decrementStock.run(item.quantity, Date.now(), item.partId, item.quantity)
      if (result.changes !== 1) throw new Error(`${item.partName} inventory changed. Refresh your cart and try again.`)
      orderItemInsert.run(order.id, item.partId, item.partName, item.unitPrice, item.quantity)
    }

    const saved = database.prepare(`SELECT ${orderColumns} ${orderJoin} WHERE orders.id = ?`).get(order.id) as Omit<CustomerOrder, 'items'>
    return withOrderItems(saved)
  },
)

export const updateCustomerOrderStatus = database.transaction(
  (id: string, status: CustomerOrder['status']) => {
    const existing = database.prepare('SELECT status FROM customer_orders WHERE id = ?').get(id) as { status: CustomerOrder['status'] } | undefined
    if (!existing) return 'missing' as const
    if (existing.status === 'cancelled' || existing.status === 'fulfilled') return 'invalid' as const
    if (status === 'cancelled') {
      const items = database.prepare('SELECT part_id AS partId, quantity FROM customer_order_items WHERE order_id = ?')
        .all(id) as Array<{ partId: string; quantity: number }>
      const restoreStock = database.prepare('UPDATE catalogue_parts SET stock = stock + ?, updated_at = ? WHERE id = ?')
      for (const item of items) restoreStock.run(item.quantity, Date.now(), item.partId)
    }
    database.prepare('UPDATE customer_orders SET status = ? WHERE id = ?').run(status, id)
    return 'updated' as const
  },
)

export const updateCustomerOrderLogistics = database.transaction(
  (id: string, logistics: OrderLogisticsInput) => {
    const order = database.prepare('SELECT status FROM customer_orders WHERE id = ?').get(id) as { status: CustomerOrder['status'] } | undefined
    if (!order) return 'missing' as const
    if (order.status === 'cancelled') return 'invalid' as const
    if (logistics.partnerId) {
      const partner = database.prepare('SELECT id FROM business_partners WHERE id = ?').get(logistics.partnerId)
      if (!partner) return 'invalid_partner' as const
    }
    database.prepare(`
      UPDATE customer_orders SET
        shipping_status = ?, status = CASE WHEN ? = 'delivered' THEN 'fulfilled' ELSE status END,
        shipping_carrier = ?, tracking_number = ?,
        tracking_url = ?, estimated_delivery = ?, partner_id = ?
      WHERE id = ?
    `).run(
      logistics.shippingStatus,
      logistics.shippingStatus,
      logistics.shippingCarrier,
      logistics.trackingNumber,
      logistics.trackingUrl,
      logistics.estimatedDelivery,
      logistics.partnerId,
      id,
    )
    return 'updated' as const
  },
)

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
