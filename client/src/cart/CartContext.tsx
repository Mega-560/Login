import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { catalogueApi } from '../data/catalogueApi'
import type { CataloguePart } from '../data/catalogueParts'

const storageKey = 'nexusflow-client-cart'

export interface CartLine {
  part: CataloguePart
  quantity: number
}

interface CartContextValue {
  items: CartLine[]
  itemCount: number
  subtotal: number
  storageError: string
  catalogueParts: CataloguePart[]
  catalogueLoading: boolean
  catalogueError: string
  refreshCatalogue: () => Promise<void>
  addItem: (part: CataloguePart, quantity?: number) => void
  addItems: (parts: CataloguePart[]) => void
  setQuantity: (partId: string, quantity: number) => void
  removeItem: (partId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readCart(parts: CataloguePart[]): CartLine[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(stored)) return []

    return stored.flatMap((entry): CartLine[] => {
      if (typeof entry !== 'object' || entry === null || !('partId' in entry) || !('quantity' in entry)) return []
      const { partId, quantity } = entry
      if (typeof partId !== 'string' || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) return []
      const part = parts.find((candidate) => candidate.id === partId)
      return part ? [{ part, quantity: Math.min(quantity, part.stock) }] : []
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [catalogueParts, setCatalogueParts] = useState<CataloguePart[]>([])
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [catalogueError, setCatalogueError] = useState('')
  const [cartHydrated, setCartHydrated] = useState(false)
  const [storageError, setStorageError] = useState('')

  async function refreshCatalogue() {
    setCatalogueLoading(true)
    setCatalogueError('')
    try {
      const parts = await catalogueApi.getParts()
      setCatalogueParts(parts)
      setItems((current) => {
        const source = cartHydrated ? current : readCart(parts)
        return source.flatMap(({ part, quantity }) => {
          const currentPart = parts.find(({ id }) => id === part.id)
          return currentPart?.active !== false && currentPart
            ? [{ part: currentPart, quantity: Math.min(quantity, currentPart.stock) }].filter(({ quantity: count }) => count > 0)
            : []
        })
      })
      setCartHydrated(true)
    } catch (error) {
      setCatalogueError(error instanceof Error ? error.message : 'Could not load catalogue inventory.')
    } finally {
      setCatalogueLoading(false)
    }
  }

  useEffect(() => {
    void refreshCatalogue()
  }, [])

  useEffect(() => {
    if (!cartHydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items.map(({ part, quantity }) => ({ partId: part.id, quantity }))))
      setStorageError('')
    } catch {
      setStorageError('Your cart could not be saved in this browser. It may be lost when you leave this page.')
    }
  }, [cartHydrated, items])

  const value = useMemo<CartContextValue>(() => ({
    items,
    catalogueParts,
    catalogueLoading,
    catalogueError,
    refreshCatalogue,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.part.price * item.quantity, 0),
    storageError,
    addItem: (part, quantity = 1) => {
      if (!Number.isInteger(quantity) || quantity < 1) return
      setItems((current) => {
        const next = new Map(current.map((line) => [line.part.id, line]))
        const currentQuantity = next.get(part.id)?.quantity ?? 0
        if (currentQuantity < part.stock) {
          next.set(part.id, { part, quantity: Math.min(currentQuantity + quantity, part.stock) })
        }
        return Array.from(next.values())
      })
    },
    addItems: (parts) => {
      setItems((current) => {
        const next = new Map(current.map((line) => [line.part.id, line]))
        for (const part of parts) {
          const currentQuantity = next.get(part.id)?.quantity ?? 0
          if (currentQuantity < part.stock) {
            next.set(part.id, { part, quantity: Math.min(currentQuantity + 1, part.stock) })
          }
        }
        return Array.from(next.values())
      })
    },
    setQuantity: (partId, quantity) => {
      setItems((current) => current.flatMap((line) => {
        if (line.part.id !== partId) return [line]
        if (!Number.isInteger(quantity) || quantity < 1) return []
        return [{ ...line, quantity: Math.min(quantity, line.part.stock) }]
      }))
    },
    removeItem: (partId) => setItems((current) => current.filter(({ part }) => part.id !== partId)),
    clearCart: () => setItems([]),
  }), [items, catalogueParts, catalogueLoading, catalogueError, storageError])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used within CartProvider.')
  return cart
}
