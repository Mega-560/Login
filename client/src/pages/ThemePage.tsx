import { useState } from 'react'
import { applyTheme, isThemeId, themes, themeStorageKey, type ThemeId } from '../theme'

function ThemePage() {
  const savedTheme = window.localStorage.getItem(themeStorageKey)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(isThemeId(savedTheme) ? savedTheme : 'forest')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function chooseTheme(theme: ThemeId) {
    setSelectedTheme(theme)
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

  return (
    <section className="theme-settings-page">
      <header className="theme-settings-header">
        <div>
          <p className="eyebrow">PERSONALIZATION</p>
          <h1>Choose your theme</h1>
          <p className="theme-settings-subtitle">Make your client workspace feel like yours. This setting only changes your client portal.</p>
        </div>
        <span className="theme-saved-indicator"><span /> Saved on this device</span>
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

      <footer className="theme-settings-footer">
        <span className="theme-feedback" role={error ? 'alert' : 'status'}>{error || notice || 'Choose a theme to apply it instantly.'}</span>
        <button className="theme-reset-button" type="button" title="Restore the default Forest theme" onClick={() => chooseTheme('forest')}>
          Reset to default
        </button>
      </footer>
    </section>
  )
}

export default ThemePage
