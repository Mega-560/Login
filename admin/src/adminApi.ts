export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: number
}

export interface PagePermission {
  view: boolean
  edit: boolean
  update: boolean
}

export type UserPagePermissions = Record<'home' | 'about' | 'contact', PagePermission>

export interface AdminCataloguePart {
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

export interface CustomerOrder {
  id: string
  userId: number
  customerName: string
  customerEmail: string
  shippingAddress: string
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
  paymentStatus: 'due' | 'paid' | 'refunded'
  currency: 'USD'
  subtotal: number
  createdAt: number
  items: Array<{ partId: string; partName: string; unitPrice: number; quantity: number }>
}

export class AdminApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

const adminApiBaseUrl = (import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || '/api/admin').replace(/\/+$/, '')

async function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${adminApiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const responseBody = await response.text()
  if (response.status === 204) return undefined as T
  let result: unknown
  if (responseBody) {
    try {
      result = JSON.parse(responseBody) as unknown
    } catch {
      if (response.ok) {
        throw new AdminApiError('The admin API returned an invalid response.', response.status)
      }
    }
  } else if (response.ok) {
    throw new AdminApiError('The admin API returned an empty response.', response.status)
  }

  if (!response.ok) {
    const error = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : `The admin request failed (HTTP ${response.status}).`
    throw new AdminApiError(error, response.status)
  }

  return result as T
}

export const adminApi = {
  getUsers: async () => (await request<{ users: AdminUser[] }>('GET', '/users')).users,
  createUser: (user: { name: string; email: string; password: string }) =>
    request<{ user: Omit<AdminUser, 'created_at'> }>('POST', '/users', user),
  updateUser: (id: number, user: { name: string; email: string }) =>
    request<{ user: Omit<AdminUser, 'created_at'> }>('PATCH', `/users/${id}`, user),
  getUserPermissions: async (id: number) =>
    (await request<{ permissions: UserPagePermissions }>('GET', `/users/${id}/permissions`)).permissions,
  updateUserPermissions: (id: number, permissions: UserPagePermissions) =>
    request<{ permissions: UserPagePermissions }>('PUT', `/users/${id}/permissions`, { permissions }),
  getCatalogueParts: async () => (await request<{ parts: AdminCataloguePart[] }>('GET', '/catalogue/parts')).parts,
  saveCataloguePart: (part: Omit<AdminCataloguePart, 'active' | 'updatedAt'>, editing: boolean) =>
    request<{ part: AdminCataloguePart }>(editing ? 'PUT' : 'POST', editing ? `/catalogue/parts/${encodeURIComponent(part.id)}` : '/catalogue/parts', part),
  setCataloguePartActive: (id: string, active: boolean) =>
    request<{ success: boolean }>('PATCH', `/catalogue/parts/${encodeURIComponent(id)}/active`, { active }),
  getManualCategories: async () => (await request<{ categories: ManualCategory[] }>('GET', '/catalogue/manual-categories')).categories,
  createManualCategory: async (name: string, parentId: string) =>
    (await request<{ category: ManualCategory }>('POST', '/catalogue/manual-categories', { name, parentId })).category,
  getCatalogueManuals: async () => (await request<{ manuals: CatalogueManual[] }>('GET', '/catalogue/manuals')).manuals,
  uploadCatalogueManual: async (categoryId: string, file: File) => {
    const url = `${adminApiBaseUrl}/catalogue/manuals?categoryId=${encodeURIComponent(categoryId)}&name=${encodeURIComponent(file.name)}`
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    })
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => undefined)
      const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `The admin request failed (HTTP ${response.status}).`
      throw new AdminApiError(message, response.status)
    }
    return (await response.json() as { manual: CatalogueManual }).manual
  },
  getCatalogueManualFile: async (id: string) => {
    const apiBase = adminApiBaseUrl.endsWith('/admin') ? adminApiBaseUrl.slice(0, -6) : adminApiBaseUrl
    const response = await fetch(`${apiBase}/catalogue/manuals/${encodeURIComponent(id)}/file`, {
      credentials: 'include',
    })
    if (!response.ok) throw new AdminApiError(`Could not load catalogue manual (HTTP ${response.status}).`, response.status)
    return response.arrayBuffer()
  },
  deleteCatalogueManual: async (id: string) => {
    await request<void>('DELETE', `/catalogue/manuals/${encodeURIComponent(id)}`)
  },
  getOrders: async () => (await request<{ orders: CustomerOrder[] }>('GET', '/orders')).orders,
  updateOrderStatus: async (id: string, status: CustomerOrder['status']) =>
    (await request<{ order: CustomerOrder }>('PATCH', `/orders/${encodeURIComponent(id)}/status`, { status })).order,
}
