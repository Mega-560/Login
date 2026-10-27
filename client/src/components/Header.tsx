import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { SessionUser } from '../modules/auth/authApi'
import { authApi } from '../modules/auth/authApi'
import { useCart } from '../cart/CartContext'

interface HeaderProps {
  user: SessionUser
}

const allowedImageTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxImageBytes = 512 * 1024

function Header({ user }: HeaderProps) {
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const [profile, setProfile] = useState(user)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const initials = profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(selectedImage)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedImage])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  async function handleLogout() {
    setLogoutError('')
    setIsLoggingOut(true)
    try {
      await authApi.logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Could not log out.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  function openProfile() {
    setName(profile.name)
    setEmail(profile.email)
    setSelectedImage(null)
    setProfileError('')
    setIsMenuOpen(false)
    setIsProfileOpen(true)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError('')
    setIsSaving(true)
    try {
      const response = await authApi.updateProfile(name.trim(), email.trim())
      setProfile(response.user)
      setImageFailed(false)
      setIsProfileOpen(false)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (!allowedImageTypes.includes(file.type) || file.size > maxImageBytes) {
      setProfileError('Choose a PNG, JPEG, or WebP image no larger than 512 KB.')
      return
    }
    setProfileError('')
    setSelectedImage(file)
  }

  async function uploadImage() {
    if (!selectedImage) return
    setProfileError('')
    setIsUploading(true)
    try {
      const response = await authApi.uploadAvatar(selectedImage)
      setProfile((current) => ({ ...current, avatarUrl: response.avatarUrl }))
      setImageFailed(false)
      setSelectedImage(null)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not upload your photo.')
    } finally {
      setIsUploading(false)
    }
  }

  async function removeImage() {
    setProfileError('')
    setIsUploading(true)
    try {
      await authApi.removeAvatar()
      setProfile((current) => ({ ...current, avatarUrl: null }))
      setImageFailed(false)
      setSelectedImage(null)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not remove your photo.')
    } finally {
      setIsUploading(false)
    }
  }

  const avatar = (previewUrl || (!imageFailed && profile.avatarUrl))

  return (
    <header className="topbar">
      <div>
        <span className="topbar-kicker">NEXUSFLOW / WORKSPACE</span>
        <p className="topbar-caption">A clearer view of what matters.</p>
      </div>
      <div className="topbar-actions">
        <Link className="topbar-cart-link" to="/cart" aria-label={`Shopping cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} title={`Open cart${itemCount > 0 ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span className="topbar-cart-label">Cart</span>
          <span className="topbar-cart-count">{itemCount}</span>
        </Link>
        <div
          className={`topbar-profile-wrap${isMenuOpen ? ' is-open' : ''}`}
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
          onFocus={() => setIsMenuOpen(true)}
          onBlur={(event) => {
            const nextTarget = event.relatedTarget
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setIsMenuOpen(false)
            }
          }}
        >
          <button
            className="topbar-account"
            type="button"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            aria-controls="account-profile-menu"
            title="Open account options"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="avatar avatar-small">
              {avatar && <img src={avatar} alt="" onError={() => setImageFailed(true)} />}
              {!avatar && initials}
            </span>
            <span className="topbar-user-copy">
              <strong>{profile.name}</strong>
              <small>{profile.email}</small>
            </span>
            <span className="topbar-profile-caret" aria-hidden="true">⌄</span>
          </button>
          <div className="profile-dropdown" id="account-profile-menu" role="group" aria-label="Account options">
            <div className="profile-dropdown-heading">
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
            </div>
            <button type="button" onClick={openProfile}>Profile settings</button>
            <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </div>
      {logoutError && <span className="topbar-logout-error" role="alert">{logoutError}</span>}

      {isProfileOpen && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsProfileOpen(false)
          }}
        >
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="profile-modal-heading">
              <div>
                <span className="topbar-kicker">ACCOUNT SETTINGS</span>
                <h2 id="profile-modal-title">Your profile</h2>
                <p>Update the details and photo shown across your workspace.</p>
              </div>
              <button className="profile-modal-close" type="button" aria-label="Close profile settings" title="Close profile settings" onClick={() => setIsProfileOpen(false)}>×</button>
            </div>
            <form onSubmit={saveProfile}>
              <div className="profile-photo-editor">
                <span className="avatar profile-photo-preview">
                  {avatar && <img src={avatar} alt="" onError={() => setImageFailed(true)} />}
                  {!avatar && initials}
                </span>
                <div className="profile-photo-controls">
                  <label className="profile-file-label">
                    Choose a photo
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
                  </label>
                  <small>PNG, JPEG, or WebP · up to 512 KB</small>
                  {selectedImage && (
                    <button className="profile-secondary-button" type="button" onClick={uploadImage} disabled={isUploading}>
                      {isUploading ? 'Uploading…' : 'Upload photo'}
                    </button>
                  )}
                  {profile.avatarUrl && !selectedImage && (
                    <button className="profile-remove-photo" type="button" onClick={removeImage} disabled={isUploading}>
                      {isUploading ? 'Removing…' : 'Remove photo'}
                    </button>
                  )}
                </div>
              </div>
              <label className="profile-field">
                <span>Full name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required autoComplete="name" autoFocus />
              </label>
              <label className="profile-field">
                <span>Email address</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
              </label>
              {profileError && <p className="profile-form-error" role="alert">{profileError}</p>}
              <div className="profile-modal-actions">
                <button className="profile-secondary-button" type="button" onClick={() => setIsProfileOpen(false)}>Cancel</button>
                <button className="profile-save-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </header>
  )
}

export default Header
