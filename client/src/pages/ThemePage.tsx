import { useState } from 'react'
import {
  applyCustomTheme,
  applyTheme,
  customThemeStorageKey,
  defaultCustomTheme,
  isCustomThemeColors,
  isThemeId,
  normalizeCustomThemeColors,
  themes,
  themeStorageKey,
  type CustomThemeColors,
  type ThemeId,
} from '../theme'

type ThemeSelection = ThemeId | 'custom'

function readSavedTheme(): ThemeSelection {
  try {
    const saved = window.localStorage.getItem(themeStorageKey)
    if (saved === 'custom') {
      const colors: unknown = JSON.parse(window.localStorage.getItem(customThemeStorageKey) ?? 'null')
      return isCustomThemeColors(colors) ? 'custom' : 'forest'
    }
    return isThemeId(saved) ? saved : 'forest'
  } catch {
    return 'forest'
  }
}

function readSavedCustomTheme(): CustomThemeColors {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(customThemeStorageKey) ?? 'null')
    return isCustomThemeColors(saved) ? normalizeCustomThemeColors(saved) : defaultCustomTheme
  } catch {
    return defaultCustomTheme
  }
}

function ThemePage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeSelection>(readSavedTheme)
  const [customColors, setCustomColors] = useState<CustomThemeColors>(readSavedCustomTheme)
  const [customSaved, setCustomSaved] = useState(() => readSavedTheme() === 'custom')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function chooseTheme(theme: ThemeId) {
    setSelectedTheme(theme)
    setCustomSaved(false)
    setNotice('')
    setError('')
    applyTheme(theme)
    try {
      window.localStorage.setItem(themeStorageKey, theme)
      setNotice(`${theme} theme applied to your client portal.`)
    } catch {
      setError('The theme was applied for this visit but could not be saved in this browser.')
    }
  }

  function updateCustomColor(color: keyof CustomThemeColors, value: string) {
    const nextColors = { ...customColors, [color]: value }
    setCustomColors(nextColors)
    setSelectedTheme('custom')
    setCustomSaved(false)
    setNotice('')
    setError('')
    applyCustomTheme(nextColors)
  }

  function saveCustomTheme() {
    setSelectedTheme('custom')
    setNotice('')
    setError('')
    applyCustomTheme(customColors)
    try {
      window.localStorage.setItem(customThemeStorageKey, JSON.stringify(customColors))
      window.localStorage.setItem(themeStorageKey, 'custom')
      setCustomSaved(true)
      setNotice('Your custom colors have been saved and applied to your client portal.')
    } catch {
      setError('Your custom colors are applied for this visit but could not be saved in this browser.')
    }
  }

  return (
    <section className="theme-settings-page">
      <header className="theme-settings-header">
        <div>
          <p className="eyebrow">PERSONALIZATION</p>
          <h1>Choose your theme</h1>
          <p className="theme-settings-subtitle">Make your client workspace feel like yours. This setting only changes your client portal.</p>
        </div>
        <span className="theme-saved-indicator"><span /> {selectedTheme === 'custom' ? (customSaved ? 'Custom theme saved' : 'Previewing custom colors') : 'Saved on this device'}</span>
      </header>

      <div className="theme-settings-note">
        <span className="theme-note-icon" aria-hidden="true">✦</span>
        <p><strong>One choice, your whole workspace.</strong> Your selected colors apply across client pages and sign-in. Admin portal themes are managed separately.</p>
      </div>

      <div className="theme-card-grid" role="radiogroup" aria-label="Client portal themes">
        {themes.map((theme) => {
          const selected = selectedTheme === theme.id
          return (
            <button
              className={`theme-option-card${selected ? ' selected' : ''}`}
              type="button"
              key={theme.id}
              role="radio"
              aria-checked={selected}
              title={`${theme.name}: ${theme.description}. Select to apply this theme.`}
              onClick={() => chooseTheme(theme.id)}
            >
              <span className={`theme-preview theme-preview-${theme.id}`} aria-hidden="true">
                <span className="theme-preview-sidebar">
                  <span className="theme-preview-mark" />
                  <span className="theme-preview-nav active" />
                  <span className="theme-preview-nav" />
                  <span className="theme-preview-nav short" />
                </span>
                <span className="theme-preview-content">
                  <span className="theme-preview-topbar" />
                  <span className="theme-preview-heading" />
                  <span className="theme-preview-copy" />
                  <span className="theme-preview-panels"><i /><i /><i /></span>
                </span>
              </span>
              <span className="theme-option-details">
                <span className="theme-option-copy">
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </span>
                <span className="theme-swatches" aria-label={`${theme.name} color palette`}>
                  {theme.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
                </span>
              </span>
              <span className="theme-option-check" aria-hidden="true">{selected ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>

      <section className={`custom-theme-panel${selectedTheme === 'custom' ? ' selected' : ''}`} aria-labelledby="custom-theme-title">
        <div className="custom-theme-heading">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2 id="custom-theme-title">Design a custom theme</h2>
            <p>Pick colors for your workspace. Changes preview instantly; save to keep them on this device.</p>
          </div>
          <div className="custom-theme-preview" aria-label="Custom theme preview">
            {[customColors.sidebar, customColors.accent, customColors.hover, customColors.page, customColors.surface].map((color, index) => (
              <span key={`${index}-${color}`} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
        <div className="custom-theme-colors">
          {([
            ['sidebar', 'Sidebar', 'Navigation and brand color'],
            ['accent', 'Accent', 'Buttons and highlights'],
            ['hover', 'Hover color', 'Interactive elements on hover'],
            ['page', 'Page background', 'Main workspace background'],
            ['surface', 'Card surface', 'Panels and cards'],
          ] as const).map(([key, label, description]) => (
            <label className="custom-theme-color" key={key}>
              <span className="custom-theme-color-swatch" style={{ backgroundColor: customColors[key] }}>
                <input
                  type="color"
                  value={customColors[key]}
                  aria-label={`${label} color`}
                  onChange={(event) => updateCustomColor(key, event.currentTarget.value)}
                />
              </span>
              <span className="custom-theme-color-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <code>{customColors[key].toUpperCase()}</code>
            </label>
          ))}
        </div>
        <div className="custom-theme-actions">
          <span>Text and hover text colors are chosen automatically for contrast.</span>
          <button className="custom-theme-save-button" type="button" onClick={saveCustomTheme}>Save custom theme</button>
        </div>
      </section>

      <footer className="theme-settings-footer">
        <span className="theme-feedback" role={error ? 'alert' : 'status'}>
          {error || notice || (selectedTheme === 'custom' && !customSaved
            ? 'Custom colors are previewed. Save them to keep this theme on your device.'
            : 'Choose a theme to apply it instantly.')}
        </span>
        <button className="theme-reset-button" type="button" title="Restore the default Forest theme" onClick={() => chooseTheme('forest')}>
          Reset to default
        </button>
      </footer>
    </section>
  )
}

export default ThemePage
