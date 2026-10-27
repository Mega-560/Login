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

export class AdminApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

const adminApiBaseUrl = (import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || '/api/admin').replace(/\/+$/, '')

async function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT', path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${adminApiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const responseBody = await response.text()
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
}
