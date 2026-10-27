import type { AuthUser } from './database.js'

declare global {
  namespace Express {
    interface Locals {
      authUser?: AuthUser
    }
  }
}

export {}
