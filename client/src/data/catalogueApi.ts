import type { CataloguePart } from './catalogueParts'

export interface CatalogueManualCategory {
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

export interface OrderItem {
  partId: string
  partName: string
  unitPrice: number
  quantity: number
}

export interface CustomerOrder {
  id: string
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
  partnerType: 'dealer' | 'retailer' | null
  paymentStatus: 'due' | 'paid' | 'refunded'
  currency: 'USD'
  subtotal: number
  createdAt: number
  items: OrderItem[]
}

export class CatalogueApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CatalogueApiError'
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: options?.body === undefined
      ? options?.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  })

  if (response.status === 204) return undefined as T
  const text = await response.text()
  let payload: unknown
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      if (response.ok) throw new CatalogueApiError('The catalogue service returned an invalid response.', response.status)
    }
  }
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `The catalogue request failed (HTTP ${response.status}).`
    throw new CatalogueApiError(message, response.status)
  }
  return payload as T
}

export const catalogueApi = {
  getParts: async () => (await request<{ parts: CataloguePart[] }>('/catalogue/parts')).parts,
  getManualCategories: async () => (await request<{ categories: CatalogueManualCategory[] }>('/catalogue/manual-categories')).categories,
  getManuals: async () => (await request<{ manuals: CatalogueManual[] }>('/catalogue/manuals')).manuals,
  getManualFile: async (id: string) => {
    const response = await fetch(`/api/catalogue/manuals/${encodeURIComponent(id)}/file`, { credentials: 'same-origin' })
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => undefined)
      const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Could not load catalogue manual (HTTP ${response.status}).`
      throw new CatalogueApiError(message, response.status)
    }
    return response.arrayBuffer()
  },
  placeOrder: (order: {
    customerName: string
    customerEmail: string
    shippingAddress: string
    items: Array<{ partId: string; quantity: number }>
  }) => request<{ order: CustomerOrder }>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: async () => (await request<{ orders: CustomerOrder[] }>('/orders')).orders,
}
