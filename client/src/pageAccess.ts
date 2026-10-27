export const clientPages = [
  { key: 'home', label: 'Home', path: '/', marker: 'H' },
  { key: 'about', label: 'About us', path: '/about', marker: 'A' },
  { key: 'contact', label: 'Contact us', path: '/contact', marker: 'C' },
] as const

export type ClientPageKey = typeof clientPages[number]['key']

export interface PagePermission {
  view: boolean
  edit: boolean
  update: boolean
}

export type UserPagePermissions = Record<ClientPageKey, PagePermission>

export const defaultPagePermissions: UserPagePermissions = {
  home: { view: true, edit: false, update: false },
  about: { view: true, edit: false, update: false },
  contact: { view: true, edit: false, update: false },
}

export function normalizePagePermissions(value: unknown): UserPagePermissions {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      home: { ...defaultPagePermissions.home },
      about: { ...defaultPagePermissions.about },
      contact: { ...defaultPagePermissions.contact },
    }
  }

  const input = value as Record<string, unknown>
  return Object.fromEntries(clientPages.map(({ key }) => {
    const entry = input[key]
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return [key, { view: false, edit: false, update: false }]
    }
    const permission = entry as Record<string, unknown>
    const view = permission.view === true
    const edit = view && permission.edit === true
    const update = edit && permission.update === true
    return [key, { view, edit, update }]
  })) as UserPagePermissions
}

export function firstAccessiblePage(permissions: UserPagePermissions): string | undefined {
  return clientPages.find(({ key }) => permissions[key].view)?.path
}
