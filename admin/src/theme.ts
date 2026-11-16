export const themeStorageKey = 'nexusflow-admin-theme'
export const customThemeStorageKey = 'nexusflow-admin-custom-theme'

export interface CustomThemeColors {
  sidebar: string
  accent: string
  hover: string
  page: string
  surface: string
}

export function getCatalogThemeColors(): CustomThemeColors {
  const rootStyles = getComputedStyle(document.documentElement)
  const readColor = (role: keyof CustomThemeColors, fallback: string) =>
    rootStyles.getPropertyValue(`--admin-palette-catalog-${role}`).trim() || fallback

  return {
    sidebar: readColor('sidebar', '#292929'),
    accent: readColor('accent', '#e7193b'),
    hover: readColor('hover', '#c91432'),
    page: readColor('page', '#f5f5f5'),
    surface: readColor('surface', '#ffffff'),
  }
}

export const themes = [
  { id: 'catalog', name: 'Catalog Red', description: 'Clean catalog red with crisp white surfaces' },
  { id: 'forest', name: 'Blue Steel', description: 'Focused navy with crisp dashboard blue' },
  { id: 'ocean', name: 'Ocean', description: 'Fresh blues and cool surfaces' },
  { id: 'violet', name: 'Violet', description: 'Expressive purple with soft lilac' },
  { id: 'midnight', name: 'Midnight', description: 'Deep contrast for a focused workspace' },
] as const

export type ThemeId = typeof themes[number]['id']

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value)
}

export function isCustomThemeColors(value: unknown): value is CustomThemeColors {
  if (typeof value !== 'object' || value === null) return false
  const colors = value as Record<string, unknown>
  return ['sidebar', 'accent', 'hover', 'page', 'surface'].every((key) =>
    typeof colors[key] === 'string' && /^#[\da-f]{6}$/i.test(colors[key] as string))
}

function getContrastColor(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [0, 0, 0]
  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
  return luminance > 0.42 ? '#17231c' : '#ffffff'
}

function clearCustomProperties() {
  const root = document.documentElement
  root.style.removeProperty('color-scheme')
  for (const property of [
    '--theme-sidebar',
    '--theme-sidebar-text',
    '--theme-accent',
    '--theme-accent-hover',
    '--theme-accent-text',
    '--theme-hover-text',
    '--theme-accent-soft',
    '--theme-surface',
    '--theme-page',
    '--theme-text',
    '--theme-muted',
    '--theme-border',
  ]) {
    root.style.removeProperty(property)
  }
}

export function applyTheme(theme: ThemeId) {
  clearCustomProperties()
  document.documentElement.dataset.nexusTheme = theme
}

export function applyCustomTheme(colors: CustomThemeColors) {
  const root = document.documentElement
  const pageText = getContrastColor(colors.page)
  root.dataset.nexusTheme = 'custom'
  root.style.colorScheme = pageText === '#ffffff' ? 'dark' : 'light'
  root.style.setProperty('--theme-sidebar', colors.sidebar)
  root.style.setProperty('--theme-sidebar-text', getContrastColor(colors.sidebar))
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-accent-hover', colors.hover)
  root.style.setProperty('--theme-accent-text', getContrastColor(colors.accent))
  root.style.setProperty('--theme-hover-text', getContrastColor(colors.hover))
  root.style.setProperty('--theme-accent-soft', `color-mix(in srgb, ${colors.accent} 20%, ${colors.surface})`)
  root.style.setProperty('--theme-surface', colors.surface)
  root.style.setProperty('--theme-page', colors.page)
  root.style.setProperty('--theme-text', pageText)
  root.style.setProperty('--theme-muted', `color-mix(in srgb, ${pageText} 58%, ${colors.page})`)
  root.style.setProperty('--theme-border', `color-mix(in srgb, ${pageText} 14%, ${colors.page})`)
}

export function applySavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey)
    if (savedTheme === 'custom') {
      const savedColors: unknown = JSON.parse(window.localStorage.getItem(customThemeStorageKey) ?? 'null')
      if (isCustomThemeColors(savedColors)) {
        applyCustomTheme(savedColors)
        return
      }
    }
    applyTheme(isThemeId(savedTheme) ? savedTheme : 'catalog')
  } catch {
    applyTheme('catalog')
  }
}
