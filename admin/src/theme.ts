export const themeStorageKey = 'nexusflow-admin-theme'
export const customThemeStorageKey = 'nexusflow-admin-custom-theme'

export interface CustomThemeColors {
  sidebar: string
  accent: string
  hover: string
  page: string
  surface: string
}

export const defaultCustomTheme: CustomThemeColors = {
  sidebar: '#193a32',
  accent: '#d8ed8d',
  hover: '#cce57a',
  page: '#f4f5f0',
  surface: '#ffffff',
}

export const themes = [
  { id: 'forest', name: 'Forest', description: 'Calm greens and warm neutrals', colors: ['#193a32', '#d8ed8d', '#f4f5f0'] },
  { id: 'ocean', name: 'Ocean', description: 'Fresh blues and cool surfaces', colors: ['#173b55', '#83d8e5', '#eef5f8'] },
  { id: 'violet', name: 'Violet', description: 'Expressive purple with soft lilac', colors: ['#392b55', '#c8afff', '#f4f1f9'] },
  { id: 'midnight', name: 'Midnight', description: 'Deep contrast for a focused workspace', colors: ['#18212d', '#a8d6bd', '#e9edf1'] },
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
    applyTheme(isThemeId(savedTheme) ? savedTheme : 'forest')
  } catch {
    applyTheme('forest')
  }
}
