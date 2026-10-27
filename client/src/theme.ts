export const themeStorageKey = 'nexusflow-client-theme'

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

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.nexusTheme = theme
}

export function applySavedTheme() {
  const savedTheme = window.localStorage.getItem(themeStorageKey)
  applyTheme(isThemeId(savedTheme) ? savedTheme : 'forest')
}
