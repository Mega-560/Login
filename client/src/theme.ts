export const themeStorageKey = 'nexusflow-client-theme'
export const customThemeStorageKey = 'nexusflow-client-custom-theme'

export interface CustomThemeColors {
  sidebar: string
  accent: string
  hover: string
  page: string
  surface: string
}

export function getDefaultCustomTheme(): CustomThemeColors {
  const rootStyles = getComputedStyle(document.documentElement)
  const readColor = (role: keyof CustomThemeColors, fallback: string) =>
    rootStyles.getPropertyValue(`--client-palette-forest-${role}`).trim() || fallback

  return {
    sidebar: readColor('sidebar', '#522d60'),
    accent: readColor('accent', '#ff9a00'),
    hover: readColor('hover', '#e68a00'),
    page: readColor('page', '#ffffff'),
    surface: readColor('surface', '#ffffff'),
  }
}

export const themes = [
  { id: 'forest', name: 'Roadster', description: 'Amber accents on a rich plum sidebar and white pages' },
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
  return ['sidebar', 'accent', 'page', 'surface'].every((key) =>
    typeof colors[key] === 'string' && /^#[\da-f]{6}$/i.test(colors[key] as string))
    && (colors.hover === undefined || (typeof colors.hover === 'string' && /^#[\da-f]{6}$/i.test(colors.hover)))
}

export function normalizeCustomThemeColors(colors: CustomThemeColors): Required<CustomThemeColors> {
  return {
    ...colors,
    hover: colors.hover ?? getDefaultCustomTheme().hover,
  }
}

function getContrastColor(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [0, 0, 0]
  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
  return luminance > 0.179 ? '#17231c' : '#ffffff'
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.nexusTheme = theme
  document.documentElement.style.removeProperty('color-scheme')
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
    document.documentElement.style.removeProperty(property)
  }
}

export function applyCustomTheme(colors: CustomThemeColors) {
  const root = document.documentElement
  const resolvedColors = normalizeCustomThemeColors(colors)
  const pageText = getContrastColor(resolvedColors.page)
  root.dataset.nexusTheme = 'custom'
  root.style.colorScheme = pageText === '#ffffff' ? 'dark' : 'light'
  root.style.setProperty('--theme-sidebar', resolvedColors.sidebar)
  root.style.setProperty('--theme-sidebar-text', getContrastColor(resolvedColors.sidebar))
  root.style.setProperty('--theme-accent', resolvedColors.accent)
  root.style.setProperty('--theme-accent-hover', resolvedColors.hover)
  root.style.setProperty('--theme-accent-text', getContrastColor(resolvedColors.accent))
  root.style.setProperty('--theme-hover-text', getContrastColor(resolvedColors.hover))
  root.style.setProperty('--theme-accent-soft', `color-mix(in srgb, ${resolvedColors.accent} 20%, ${resolvedColors.surface})`)
  root.style.setProperty('--theme-surface', resolvedColors.surface)
  root.style.setProperty('--theme-page', resolvedColors.page)
  root.style.setProperty('--theme-text', pageText)
  root.style.setProperty('--theme-muted', `color-mix(in srgb, ${pageText} 58%, ${resolvedColors.page})`)
  root.style.setProperty('--theme-border', `color-mix(in srgb, ${pageText} 14%, ${resolvedColors.page})`)
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
