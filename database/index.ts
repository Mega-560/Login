import 'dotenv/config'
import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { rateLimit } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import helmet from 'helmet'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import {
  completePasswordReset,
  clientPageKeys,
  createUser,
  deletePasswordReset,
  findPasswordReset,
  findUserByEmail,
  findUserById,
  findUserAvatar,
  getUserPagePermissions,
  incrementPasswordResetAttempts,
  incrementTokenVersion,
  issuePasswordResetToken,
  listAdminUsers,
  saveUserPagePermissions,
  deleteUserAvatar,
  updateOwnProfile,
  updateUserAvatar,
  upsertPasswordReset,
  updateAdminUser,
  createManualCategory,
  deleteCatalogueManual,
  getCatalogueManualFile,
  listBusinessPartners,
  listCatalogueManuals,
  listCustomerOrders,
  listManualCategories,
  listCatalogueParts,
  placeCustomerOrder,
  saveBusinessPartner,
  saveCatalogueManual,
  saveCataloguePart,
  setBusinessPartnerActive,
  setCataloguePartActive,
  updateCustomerOrderLogistics,
  updateCustomerOrderStatus,
  type BusinessPartnerInput,
  type CataloguePartInput,
  type CustomerOrder,
  type OrderLogisticsInput,
  type OrderItemInput,
} from './database.js'
import type { AuthUser } from './database.js'

const port = Number(process.env.API_PORT ?? 4000)
const production = process.env.NODE_ENV === 'production'
const cookieName = production ? '__Host-nexusflow_session' : 'nexusflow_session'
const resetCookieName = production ? '__Host-nexusflow_reset' : 'nexusflow_reset'
const sessionMaxAgeMs = 15 * 60 * 1000
const resetLifetimeMs = 10 * 60 * 1000
const otpLifetimeMs = 10 * 60 * 1000
const maxOtpAttempts = 5
const bcryptRounds = 12

function loadSecret(name: 'JWT_SECRET' | 'OTP_SECRET'): Buffer {
  const value = process.env[name] ?? ''
  if (!/^(?:[0-9a-fA-F]{2}){32,}$/.test(value)) {
    throw new Error(`${name} must be at least 32 bytes of hexadecimal secret material.`)
  }
  return Buffer.from(value, 'hex')
}

const jwtSecret = loadSecret('JWT_SECRET')
const otpSecret = loadSecret('OTP_SECRET')

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const smtpUser = process.env.SMTP_USER
const smtpPassword = process.env.SMTP_PASSWORD
const smtpFrom = process.env.SMTP_FROM
const smtpSettingsProvided = [smtpHost, process.env.SMTP_PORT, smtpFrom].some(Boolean)

if (smtpSettingsProvided && (!smtpHost || !smtpPort || !smtpFrom)) {
  throw new Error('SMTP_HOST, SMTP_PORT, and SMTP_FROM must all be configured together.')
}

const mailer = smtpHost && smtpPort && smtpFrom
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true',
      ...(smtpUser && smtpPassword ? { auth: { user: smtpUser, pass: smtpPassword } } : {}),
    })
  : undefined

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use('/api/auth', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use('/api/admin', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
})

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many recovery attempts. Please try again later.' },
})

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many profile changes. Please try again later.' },
})

const allowedOrigins = new Set(
  (process.env.APP_ORIGIN ?? (production ? '' : 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

if (production && allowedOrigins.size === 0) {
  throw new Error('APP_ORIGIN must be configured in production.')
}

app.use('/api/admin', (req, res, next) => {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.vary('Origin')
  }

  if (req.method !== 'OPTIONS') {
    next()
    return
  }

  if (!origin || !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Request origin is not allowed.' })
    return
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(204).end()
})

const validateOrigin: RequestHandler = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  const origin = req.get('origin')
  if (!origin || !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Request origin is not allowed.' })
    return
  }
  next()
}
app.use('/api', validateOrigin)
app.use('/api/admin/catalogue/manuals', express.raw({ type: 'application/pdf', limit: '15mb' }))
app.use(express.json({ limit: '10kb', strict: true }))
app.use(cookieParser())

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function routeParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readText(body: unknown, key: string): string | undefined {
  if (!isRecord(body) || typeof body[key] !== 'string') return undefined
  return body[key].trim()
}

function readBusinessPartnerInput(body: unknown): BusinessPartnerInput | undefined {
  const name = readText(body, 'name')
  const type = isRecord(body) ? body.type : undefined
  const contactName = readText(body, 'contactName') ?? ''
  const emailValue = readText(body, 'email') ?? ''
  const phone = readText(body, 'phone') ?? ''
  const address = readText(body, 'address') ?? ''
  const notes = readText(body, 'notes') ?? ''
  const email = emailValue ? normalizeEmail(emailValue) : ''
  if (
    !name || name.length > 120 || (type !== 'dealer' && type !== 'retailer')
    || contactName.length > 120 || email === undefined || phone.length > 40
    || address.length > 500 || notes.length > 1_000
  ) return undefined
  return { name, type, contactName, email, phone, address, notes }
}

function readString(body: unknown, key: string): string | undefined {
  if (!isRecord(body) || typeof body[key] !== 'string') return undefined
  return body[key]
}

function normalizeEmail(value: string | undefined): string | undefined {
  if (!value || value.length > 254) return undefined
  const email = value.toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined
}

function validPassword(value: string | undefined): value is string {
  return Boolean(value && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72)
}

function publicUser(user: AuthUser) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

function setSessionCookie(res: express.Response, user: AuthUser) {
  const token = jwt.sign(
    {
      email: user.email,
      name: user.name,
      ver: user.token_version,
    },
    jwtSecret,
    {
      algorithm: 'HS256',
      subject: String(user.id),
      issuer: 'nexusflow-auth',
      audience: 'nexusflow-web',
      expiresIn: '15m',
    },
  )

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionMaxAgeMs,
  })
}

function equalDigest(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function otpDigest(email: string, code: string): string {
  return createHmac('sha256', otpSecret).update(`${email}:${code}`).digest('hex')
}

function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

const requireSession: RequestHandler = (req, res, next) => {
  const token = req.cookies[cookieName] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'nexusflow-auth',
      audience: 'nexusflow-web',
    })
    if (typeof payload === 'string' || !isRecord(payload)) {
      res.status(401).json({ error: 'Invalid or expired session.' })
      return
    }

    const claims = payload as JwtPayload & { ver?: unknown }
    const id = Number(claims.sub)
    if (!Number.isSafeInteger(id) || !Number.isInteger(claims.ver)) {
      res.status(401).json({ error: 'Invalid or expired session.' })
      return
    }

    const user = findUserById.get(id)
    if (!user || user.token_version !== claims.ver) {
      res.status(401).json({ error: 'Invalid or expired session.' })
      return
    }

    res.locals.authUser = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' })
  }
}

const requireAdmin: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser as AuthUser | undefined
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' })
    return
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const name = readText(req.body, 'name')
  const email = normalizeEmail(readText(req.body, 'email'))
  const password = readString(req.body, 'password')

  if (!name || name.length > 80 || !email || !validPassword(password)) {
    res.status(400).json({ error: 'Provide a name, valid email, and password of 12–72 bytes.' })
    return
  }
  if (findUserByEmail.get(email)) {
    res.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, bcryptRounds)
  try {
    const result = createUser.run(name, email, passwordHash, Date.now())
    const user = findUserById.get(Number(result.lastInsertRowid))
    if (!user) throw new Error('Registered user could not be loaded.')
    setSessionCookie(res, user)
    res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'An account with that email already exists.' })
      return
    }
    throw error
  }
})

async function loginForRole(req: express.Request, res: express.Response, expectedRole: AuthUser['role']) {
  const email = normalizeEmail(readText(req.body, 'email'))
  const password = readString(req.body, 'password')
  if (!email || !password || Buffer.byteLength(password, 'utf8') > 72) {
    res.status(400).json({ error: 'Enter a valid email and password.' })
    return
  }

  const user = findUserByEmail.get(email)
  if (!user || user.role !== expectedRole || !await bcrypt.compare(password, user.password_hash)) {
    res.status(401).json({ error: 'Email or password is incorrect.' })
    return
  }

  setSessionCookie(res, user)
  res.json({ user: publicUser(user) })
}

app.post('/api/auth/login/client', authLimiter, async (req, res) => {
  await loginForRole(req, res, 'user')
})

app.post('/api/auth/login/admin', authLimiter, async (req, res) => {
  await loginForRole(req, res, 'admin')
})

app.get('/api/auth/me', requireSession, (_req, res) => {
  const user = res.locals.authUser as AuthUser
  res.json({
    user: {
      ...publicUser(user),
      avatarUrl: user.avatar_mime && user.avatar_updated_at
        ? `/api/auth/profile/avatar?v=${user.avatar_updated_at}`
        : null,
      permissions: user.role === 'admin' ? undefined : getUserPagePermissions(user.id),
    },
  })
})

app.patch('/api/auth/profile', profileLimiter, requireSession, (req, res) => {
  const user = res.locals.authUser as AuthUser
  const name = readText(req.body, 'name')
  const email = normalizeEmail(readText(req.body, 'email'))
  if (!name || name.length > 80 || !email) {
    res.status(400).json({ error: 'Provide a name of up to 80 characters and a valid email address.' })
    return
  }

  const emailOwner = findUserByEmail.get(email)
  if (emailOwner && emailOwner.id !== user.id) {
    res.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  try {
    updateOwnProfile(name, email, user.id, user.email)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'An account with that email already exists.' })
      return
    }
    throw error
  }

  const updatedUser = findUserById.get(user.id)
  if (!updatedUser) throw new Error('Updated profile could not be loaded.')
  res.json({
    user: {
      ...publicUser(updatedUser),
      avatarUrl: updatedUser.avatar_mime && updatedUser.avatar_updated_at
        ? `/api/auth/profile/avatar?v=${updatedUser.avatar_updated_at}`
        : null,
    },
  })
})

app.get('/api/auth/profile/avatar', requireSession, (_req, res) => {
  const user = res.locals.authUser as AuthUser
  const avatar = findUserAvatar.get(user.id)
  if (!avatar?.avatar_data || !avatar.avatar_mime) {
    res.status(404).json({ error: 'No profile photo has been uploaded.' })
    return
  }
  res.setHeader('Content-Type', avatar.avatar_mime)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(Buffer.from(avatar.avatar_data, 'base64'))
})

app.put(
  '/api/auth/profile/avatar',
  profileLimiter,
  requireSession,
  express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '512kb' }),
  (req, res) => {
    const user = res.locals.authUser as AuthUser
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: 'Upload a PNG, JPEG, or WebP image.' })
      return
    }

    const mime = req.get('content-type')?.split(';')[0].trim()
    const image = req.body as Buffer
    const signatures: Record<string, (buffer: Buffer) => boolean> = {
      'image/png': (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
      'image/webp': (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
    }
    if (!mime || !signatures[mime]?.(image)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PNG, JPEG, or WebP image.' })
      return
    }

    const updatedAt = Math.max(Date.now(), (user.avatar_updated_at ?? 0) + 1)
    updateUserAvatar.run(image.toString('base64'), mime, updatedAt, user.id)
    res.json({ avatarUrl: `/api/auth/profile/avatar?v=${updatedAt}` })
  },
)

app.delete('/api/auth/profile/avatar', profileLimiter, requireSession, (_req, res) => {
  const user = res.locals.authUser as AuthUser
  deleteUserAvatar.run(user.id)
  res.status(204).end()
})

app.get('/api/admin/users', requireSession, requireAdmin, (_req, res) => {
  res.json({ users: listAdminUsers.all() })
})

app.post('/api/admin/users', requireSession, requireAdmin, async (req, res) => {
  const name = readText(req.body, 'name')
  const email = normalizeEmail(readText(req.body, 'email'))
  const password = readString(req.body, 'password')

  if (!name || name.length > 80 || !email || !validPassword(password)) {
    res.status(400).json({ error: 'Provide a name, valid email, and password of 12–72 bytes.' })
    return
  }
  if (findUserByEmail.get(email)) {
    res.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, bcryptRounds)
  try {
    const result = createUser.run(name, email, passwordHash, Date.now())
    const user = findUserById.get(Number(result.lastInsertRowid))
    if (!user) throw new Error('Created user could not be loaded.')
    res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'An account with that email already exists.' })
      return
    }
    throw error
  }
})

app.patch('/api/admin/users/:id', requireSession, requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const name = readText(req.body, 'name')
  const email = normalizeEmail(readText(req.body, 'email'))
  if (!Number.isSafeInteger(id) || id < 1 || !name || name.length > 80 || !email) {
    res.status(400).json({ error: 'Provide a valid user ID, name, and email.' })
    return
  }

  const existingUser = findUserById.get(id)
  if (!existingUser) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  const emailOwner = findUserByEmail.get(email)
  if (emailOwner && emailOwner.id !== id) {
    res.status(409).json({ error: 'An account with that email already exists.' })
    return
  }

  try {
    updateAdminUser(id, name, email, existingUser.email)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'An account with that email already exists.' })
      return
    }
    throw error
  }

  const user = findUserById.get(id)
  if (!user) throw new Error('Updated user could not be loaded.')
  res.json({ user: publicUser(user) })
})

app.get('/api/admin/users/:id/permissions', requireSession, requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: 'Provide a valid user ID.' })
    return
  }
  const user = findUserById.get(id)
  if (!user) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  if (user.role === 'admin') {
    res.status(400).json({ error: 'Page permissions are managed for client accounts only.' })
    return
  }
  res.json({ permissions: getUserPagePermissions(id) })
})

app.put('/api/admin/users/:id/permissions', requireSession, requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: 'Provide a valid user ID.' })
    return
  }
  const user = findUserById.get(id)
  if (!user) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  if (user.role === 'admin') {
    res.status(400).json({ error: 'Page permissions are managed for client accounts only.' })
    return
  }

  const rawPermissions = isRecord(req.body) && isRecord(req.body.permissions) ? req.body.permissions : undefined
  if (!rawPermissions) {
    res.status(400).json({ error: 'Provide page permissions for all client pages.' })
    return
  }
  const permissions = getUserPagePermissions(id)
  for (const pageKey of clientPageKeys) {
    const entry = rawPermissions[pageKey]
    if (
      !isRecord(entry)
      || typeof entry.view !== 'boolean'
      || typeof entry.edit !== 'boolean'
      || typeof entry.update !== 'boolean'
      || (entry.edit && !entry.view)
      || (entry.update && (!entry.view || !entry.edit))
    ) {
      res.status(400).json({ error: 'Edit requires view access, and update requires both view and edit access.' })
      return
    }
    permissions[pageKey] = { view: entry.view, edit: entry.edit, update: entry.update }
  }
  saveUserPagePermissions(id, permissions)
  res.json({ permissions })
})

app.get('/api/catalogue/parts', requireSession, (_req, res) => {
  res.json({ parts: listCatalogueParts() })
})

app.get('/api/catalogue/manual-categories', requireSession, (_req, res) => {
  res.json({ categories: listManualCategories() })
})

app.get('/api/catalogue/manuals', requireSession, (_req, res) => {
  res.json({ manuals: listCatalogueManuals() })
})

app.get('/api/catalogue/manuals/:id/file', requireSession, (req, res) => {
  const manualId = routeParam(req.params.id)
  const manual = manualId ? getCatalogueManualFile(manualId) : undefined
  if (!manual) {
    res.status(404).json({ error: 'Catalogue manual not found.' })
    return
  }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Length', manual.data.byteLength)
  res.setHeader('Content-Disposition', `inline; filename="${manual.name.replace(/["\\\r\n]/g, '_')}"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(manual.data)
})

app.get('/api/admin/catalogue/parts', requireSession, requireAdmin, (_req, res) => {
  res.json({ parts: listCatalogueParts(true) })
})

function readCataloguePart(body: unknown): CataloguePartInput | undefined {
  if (!isRecord(body)) return undefined
  const id = readText(body, 'id')?.toUpperCase()
  const name = readText(body, 'name')
  const category = readText(body, 'category')
  const vehicle = readText(body, 'vehicle')
  const warranty = readText(body, 'warranty')
  const image = readText(body, 'image')
  const imageAlt = readText(body, 'imageAlt')
  const description = readText(body, 'description')
  const price = body.price
  const stock = body.stock
  if (
    !id || !/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(id)
    || !name || name.length > 120
    || !category || category.length > 80
    || !vehicle || vehicle.length > 160
    || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 1_000_000
    || typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000
    || !warranty || warranty.length > 80
    || !image || image.length > 500 || (!image.startsWith('/') && !image.startsWith('https://'))
    || !imageAlt || imageAlt.length > 200
    || !description || description.length > 2_000
  ) return undefined
  return { id, name, category, vehicle, price, stock, warranty, image, imageAlt, description }
}

app.post('/api/admin/catalogue/parts', requireSession, requireAdmin, (req, res) => {
  const part = readCataloguePart(req.body)
  if (!part) {
    res.status(400).json({ error: 'Provide a valid part number, name, category, fitment, price, stock, warranty, image, and description.' })
    return
  }
  try {
    res.status(201).json({ part: saveCataloguePart(part) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'A part with that part number already exists.' })
      return
    }
    throw error
  }
})

app.put('/api/admin/catalogue/parts/:id', requireSession, requireAdmin, (req, res) => {
  const part = readCataloguePart({ ...req.body, id: req.params.id })
  if (!part) {
    res.status(400).json({ error: 'Provide valid catalogue part details.' })
    return
  }
  const existing = listCatalogueParts(true).some(({ id }) => id === part.id)
  if (!existing) {
    res.status(404).json({ error: 'Catalogue part not found.' })
    return
  }
  res.json({ part: saveCataloguePart(part) })
})

app.patch('/api/admin/catalogue/parts/:id/active', requireSession, requireAdmin, (req, res) => {
  if (!isRecord(req.body) || typeof req.body.active !== 'boolean') {
    res.status(400).json({ error: 'Provide an active boolean value.' })
    return
  }
  const partId = routeParam(req.params.id)
  if (!partId || !setCataloguePartActive(partId, req.body.active)) {
    res.status(404).json({ error: 'Catalogue part not found.' })
    return
  }
  res.json({ success: true })
})

app.get('/api/admin/catalogue/manual-categories', requireSession, requireAdmin, (_req, res) => {
  res.json({ categories: listManualCategories() })
})

app.get('/api/admin/catalogue/manuals', requireSession, requireAdmin, (_req, res) => {
  res.json({ manuals: listCatalogueManuals() })
})

app.post('/api/admin/catalogue/manual-categories', requireSession, requireAdmin, (req, res) => {
  const name = readText(req.body, 'name')
  const parentId = readText(req.body, 'parentId')
  if (!name || name.length > 80 || !parentId || !listManualCategories().some(({ id }) => id === parentId)) {
    res.status(400).json({ error: 'Provide a category name and a valid parent category.' })
    return
  }
  const category = createManualCategory(randomBytes(16).toString('hex'), parentId, name)
  res.status(201).json({ category })
})

app.post('/api/admin/catalogue/manuals', requireSession, requireAdmin, (req, res) => {
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : ''
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : ''
  const data = Buffer.isBuffer(req.body) ? req.body : undefined
  if (
    !categoryId || !listManualCategories().some(({ id }) => id === categoryId)
    || !name || name.length > 160 || !name.toLowerCase().endsWith('.pdf')
    || !data?.byteLength || !data.subarray(0, 5).equals(Buffer.from('%PDF-'))
  ) {
    res.status(400).json({ error: 'Upload a valid non-empty PDF and select a valid category.' })
    return
  }
  const manual = saveCatalogueManual(randomBytes(16).toString('hex'), categoryId, name, data)
  res.status(201).json({ manual })
})

app.delete('/api/admin/catalogue/manuals/:id', requireSession, requireAdmin, (req, res) => {
  const manualId = routeParam(req.params.id)
  if (!manualId || !deleteCatalogueManual(manualId)) {
    res.status(404).json({ error: 'Catalogue manual not found.' })
    return
  }
  res.status(204).end()
})

app.post('/api/orders', requireSession, (req, res) => {
  const user = res.locals.authUser as AuthUser
  const customerName = readText(req.body, 'customerName')
  const customerEmail = normalizeEmail(readText(req.body, 'customerEmail'))
  const shippingAddress = readText(req.body, 'shippingAddress')
  const rawItems = isRecord(req.body) && Array.isArray(req.body.items) ? req.body.items : undefined
  if (
    !customerName || customerName.length > 80
    || !customerEmail || !shippingAddress || shippingAddress.length > 500
    || !rawItems || rawItems.length < 1 || rawItems.length > 50
  ) {
    res.status(400).json({ error: 'Provide valid contact and delivery details with at least one catalogue part.' })
    return
  }
  const items: OrderItemInput[] = []
  for (const rawItem of rawItems) {
    if (
      !isRecord(rawItem) || typeof rawItem.partId !== 'string'
      || !/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(rawItem.partId)
      || typeof rawItem.quantity !== 'number' || !Number.isSafeInteger(rawItem.quantity)
      || rawItem.quantity < 1 || rawItem.quantity > 1_000
    ) {
      res.status(400).json({ error: 'One or more order items are invalid.' })
      return
    }
    items.push({ partId: rawItem.partId, quantity: rawItem.quantity })
  }
  try {
    const order = placeCustomerOrder({
      id: `NF-${randomBytes(8).toString('hex').toUpperCase()}`,
      userId: user.id,
      customerName,
      customerEmail,
      shippingAddress,
    }, items)
    res.status(201).json({ order })
  } catch (error) {
    if (error instanceof Error && /no longer available|only \d+ unit|inventory changed/i.test(error.message)) {
      res.status(409).json({ error: error.message })
      return
    }
    throw error
  }
})

app.get('/api/orders', requireSession, (_req, res) => {
  const user = res.locals.authUser as AuthUser
  res.json({ orders: listCustomerOrders(user.id) })
})

app.get('/api/admin/orders', requireSession, requireAdmin, (_req, res) => {
  res.json({ orders: listCustomerOrders() })
})

app.patch('/api/admin/orders/:id/status', requireSession, requireAdmin, (req, res) => {
  const status = isRecord(req.body) ? req.body.status : undefined
  if (status !== 'confirmed' && status !== 'fulfilled' && status !== 'cancelled') {
    res.status(400).json({ error: 'Choose a valid order status.' })
    return
  }
  const orderId = routeParam(req.params.id)
  if (!orderId) {
    res.status(400).json({ error: 'Provide a valid order ID.' })
    return
  }
  const result = updateCustomerOrderStatus(orderId, status as CustomerOrder['status'])
  if (result === 'missing') {
    res.status(404).json({ error: 'Order not found.' })
    return
  }
  if (result === 'invalid') {
    res.status(409).json({ error: 'This order is already closed and cannot be changed.' })
    return
  }
  const order = listCustomerOrders().find(({ id }) => id === orderId)
  if (!order) throw new Error('Updated order could not be loaded.')
  res.json({ order })
})

app.patch('/api/admin/orders/:id/logistics', requireSession, requireAdmin, (req, res) => {
  const orderId = routeParam(req.params.id)
  const shippingStatus = isRecord(req.body) ? req.body.shippingStatus : undefined
  const validStatuses: CustomerOrder['shippingStatus'][] = ['not_shipped', 'preparing', 'shipped', 'in_transit', 'delivered', 'exception']
  const shippingCarrier = readText(req.body, 'shippingCarrier') ?? ''
  const trackingNumber = readText(req.body, 'trackingNumber') ?? ''
  const trackingUrl = readText(req.body, 'trackingUrl') ?? ''
  const estimatedDelivery = readText(req.body, 'estimatedDelivery') ?? ''
  const partnerIdValue = readText(req.body, 'partnerId') ?? ''

  if (!orderId || !validStatuses.includes(shippingStatus as CustomerOrder['shippingStatus'])) {
    res.status(400).json({ error: 'Provide a valid order ID and shipping status.' })
    return
  }
  if (
    shippingCarrier.length > 100 || trackingNumber.length > 120 || trackingUrl.length > 500
    || estimatedDelivery && !/^\d{4}-\d{2}-\d{2}$/.test(estimatedDelivery)
    || partnerIdValue && !/^BP-[A-F0-9]{16}$/.test(partnerIdValue)
  ) {
    res.status(400).json({ error: 'One or more shipping or partner fields are invalid.' })
    return
  }
  if (estimatedDelivery) {
    const parsedDate = new Date(`${estimatedDelivery}T00:00:00.000Z`)
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== estimatedDelivery) {
      res.status(400).json({ error: 'Provide a valid estimated delivery date.' })
      return
    }
  }
  if (trackingUrl) {
    try {
      const url = new URL(trackingUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported protocol')
    } catch {
      res.status(400).json({ error: 'Tracking URL must be a valid HTTP or HTTPS URL.' })
      return
    }
  }

  const result = updateCustomerOrderLogistics(orderId, {
    shippingStatus: shippingStatus as CustomerOrder['shippingStatus'],
    shippingCarrier: shippingCarrier || null,
    trackingNumber: trackingNumber || null,
    trackingUrl: trackingUrl || null,
    estimatedDelivery: estimatedDelivery || null,
    partnerId: partnerIdValue || null,
  } satisfies OrderLogisticsInput)
  if (result === 'missing') {
    res.status(404).json({ error: 'Order not found.' })
    return
  }
  if (result === 'invalid_partner') {
    res.status(400).json({ error: 'Choose an active dealer or retailer.' })
    return
  }
  if (result === 'invalid') {
    res.status(409).json({ error: 'Shipping details cannot be changed for a cancelled order.' })
    return
  }
  const order = listCustomerOrders().find(({ id }) => id === orderId)
  if (!order) throw new Error('Updated order could not be loaded.')
  res.json({ order })
})

app.get('/api/admin/partners', requireSession, requireAdmin, (_req, res) => {
  res.json({ partners: listBusinessPartners() })
})

app.post('/api/admin/partners', requireSession, requireAdmin, (req, res) => {
  const input = readBusinessPartnerInput(req.body)
  if (!input) {
    res.status(400).json({ error: 'Provide a name and valid dealer or retailer details.' })
    return
  }
  const partner = saveBusinessPartner(`BP-${randomBytes(8).toString('hex').toUpperCase()}`, input)
  res.status(201).json({ partner })
})

app.put('/api/admin/partners/:id', requireSession, requireAdmin, (req, res) => {
  const id = routeParam(req.params.id)
  const input = readBusinessPartnerInput(req.body)
  if (!id || !/^BP-[A-F0-9]{16}$/.test(id) || !input) {
    res.status(400).json({ error: 'Provide a valid partner ID and dealer or retailer details.' })
    return
  }
  if (!listBusinessPartners().some((partner) => partner.id === id)) {
    res.status(404).json({ error: 'Business partner not found.' })
    return
  }
  res.json({ partner: saveBusinessPartner(id, input) })
})

app.patch('/api/admin/partners/:id/active', requireSession, requireAdmin, (req, res) => {
  const id = routeParam(req.params.id)
  const active = isRecord(req.body) ? req.body.active : undefined
  if (!id || !/^BP-[A-F0-9]{16}$/.test(id) || typeof active !== 'boolean') {
    res.status(400).json({ error: 'Provide a valid partner ID and active state.' })
    return
  }
  if (!setBusinessPartnerActive(id, active)) {
    res.status(404).json({ error: 'Business partner not found.' })
    return
  }
  res.json({ success: true })
})

app.post('/api/auth/logout', requireSession, (_req, res) => {
  const user = res.locals.authUser!
  incrementTokenVersion.run(user.id)
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
  })
  res.status(204).end()
})

app.post('/api/auth/forgot-password', recoveryLimiter, async (req, res) => {
  if (!mailer || !smtpFrom) {
    res.status(503).json({ error: 'Password recovery email is not configured on the server.' })
    return
  }

  const email = normalizeEmail(readText(req.body, 'email'))
  if (!email) {
    res.status(400).json({ error: 'Enter a valid email address.' })
    return
  }

  const user = findUserByEmail.get(email)
  if (!user) {
    res.status(202).json({ message: 'If an account exists, a verification code has been sent.' })
    return
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  upsertPasswordReset.run(email, otpDigest(email, code), Date.now() + otpLifetimeMs)
  await mailer.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Your NexusFlow password reset code',
    text: `Your password reset verification code is ${code}. It expires in 10 minutes.`,
  })
  res.status(202).json({ message: 'If an account exists, a verification code has been sent.' })
})

app.post('/api/auth/verify-otp', recoveryLimiter, (req, res) => {
  const email = normalizeEmail(readText(req.body, 'email'))
  const code = readText(req.body, 'code')
  if (!email || !code || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'Enter a valid email and six-digit code.' })
    return
  }

  const recovery = findPasswordReset.get(email)
  if (!recovery || recovery.expires_at <= Date.now() || recovery.attempts >= maxOtpAttempts) {
    deletePasswordReset.run(email)
    res.status(400).json({ error: 'The code is invalid or expired. Request a new code.' })
    return
  }

  if (!equalDigest(recovery.otp_digest, otpDigest(email, code))) {
    incrementPasswordResetAttempts.run(email)
    res.status(400).json({ error: 'The code is invalid or expired. Request a new code.' })
    return
  }

  const resetToken = randomBytes(32).toString('base64url')
  issuePasswordResetToken.run(tokenDigest(resetToken), Date.now() + resetLifetimeMs, email)
  res.cookie(resetCookieName, resetToken, {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
    maxAge: resetLifetimeMs,
  })
  res.json({ message: 'Verification successful.' })
})

app.post('/api/auth/reset-password', recoveryLimiter, async (req, res) => {
  const email = normalizeEmail(readText(req.body, 'email'))
  const resetToken = req.cookies[resetCookieName] as string | undefined
  const password = readString(req.body, 'password')
  if (!email || !resetToken || !validPassword(password)) {
    res.status(400).json({ error: 'Provide a valid email and password of 12–72 bytes using a verified recovery session.' })
    return
  }

  const recovery = findPasswordReset.get(email)
  const user = findUserByEmail.get(email)
  if (
    !recovery
    || !user
    || !recovery.reset_token_digest
    || !recovery.reset_token_expires_at
    || recovery.reset_token_expires_at <= Date.now()
    || !equalDigest(recovery.reset_token_digest, tokenDigest(resetToken))
  ) {
    res.status(400).json({ error: 'The reset session is invalid or expired. Request a new code.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, bcryptRounds)
  completePasswordReset(email, user.id, passwordHash)
  res.clearCookie(resetCookieName, {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
  })
  res.status(200).json({ message: 'Password reset successfully. Please sign in.' })
})

app.use((req, res) => {
  void req
  res.status(404).json({ error: 'API route not found.' })
})

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error')
  if (res.headersSent) {
    next(error)
    return
  }
  const status = isRecord(error) && typeof error.status === 'number' ? error.status : 500
  if (status === 400) {
    res.status(400).json({ error: 'Request body is invalid.' })
    return
  }
  if (status === 413) {
    res.status(413).json({ error: 'Request body is too large.' })
    return
  }
  res.status(500).json({ error: 'An unexpected server error occurred.' })
}
app.use(errorHandler)

const host = process.env.API_HOST ?? '127.0.0.1'
app.listen(port, host, () => {
  console.log(`NexusFlow API listening on http://${host}:${port}`)
})
