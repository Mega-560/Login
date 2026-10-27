import { normalizePagePermissions, type UserPagePermissions } from '../../pageAccess'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  avatarUrl?: string | null
}

export interface AuthenticatedSessionUser extends SessionUser {
  permissions: UserPagePermissions
}

export class AuthApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

function request(path: 'logout', body: unknown): Promise<void>
function request<T>(path: string, body?: unknown, method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', contentType?: string): Promise<T>
async function request<T>(
  path: string,
  body?: unknown,
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  contentType?: string,
): Promise<T | void> {
  const binaryBody = body instanceof ArrayBuffer
  const response = await fetch(`/api/auth/${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': contentType ?? (binaryBody ? 'application/octet-stream' : 'application/json') },
    body: body === undefined ? undefined : binaryBody ? body : JSON.stringify(body),
  })

  if (response.status === 204) return

  const responseBody = await response.text()
  let result: unknown
  if (responseBody) {
    try {
      result = JSON.parse(responseBody) as unknown
    } catch {
      if (response.ok) {
        throw new AuthApiError('The authentication server returned an invalid response.', response.status)
      }
    }
  } else if (response.ok) {
    throw new AuthApiError('The authentication server returned an empty response.', response.status)
  }

  if (!response.ok) {
    const message = readErrorMessage(result) ?? `The authentication request failed (HTTP ${response.status}).`
    throw new AuthApiError(message, response.status)
  }
  return result as T
}

function readErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('error' in value)) return undefined
  return typeof value.error === 'string' ? value.error : undefined
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<{ user: SessionUser }>('register', { name, email, password }),
  login: (email: string, password: string) =>
    request<{ user: SessionUser }>('login/client', { email, password }),
  getCurrentUser: async () => {
    const response = await request<{ user: Omit<AuthenticatedSessionUser, 'permissions'> & { permissions?: unknown } }>('me')
    return {
      user: {
        ...response.user,
        permissions: normalizePagePermissions(response.user.permissions),
      },
    }
  },
  updateProfile: (name: string, email: string) =>
    request<{ user: SessionUser }>('profile', { name, email }, 'PATCH'),
  uploadAvatar: async (file: File) =>
    request<{ avatarUrl: string }>('profile/avatar', await file.arrayBuffer(), 'PUT', file.type),
  removeAvatar: () => request<void>('profile/avatar', undefined, 'DELETE'),
  logout: () => request('logout', {}),
  requestPasswordReset: (email: string) =>
    request<{ message: string }>('forgot-password', { email }),
  verifyOtp: (email: string, code: string) =>
    request<{ message: string }>('verify-otp', { email, code }),
  resetPassword: (email: string, password: string) =>
    request<{ message: string }>('reset-password', { email, password }),
}
