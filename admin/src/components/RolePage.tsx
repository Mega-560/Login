import { useEffect, useState, type FormEvent } from 'react'
import Toast from './Toast'
import { adminApi, type AdminUser, type UserPagePermissions } from '../adminApi'

const pages = [
  { key: 'home', label: 'Home', description: 'Workspace overview and activity' },
  { key: 'about', label: 'About us', description: 'Company and workspace information' },
  { key: 'contact', label: 'Contact us', description: 'Contact and support information' },
] as const

function RolePage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permissions, setPermissions] = useState<UserPagePermissions | null>(null)
  const [savedPermissions, setSavedPermissions] = useState<UserPagePermissions | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    adminApi.getUsers()
      .then((accounts) => {
        if (!active) return
        const clients = accounts.filter((account) => account.role === 'user')
        setUsers(clients)
        setSelectedUserId((current) => current || (clients[0] ? String(clients[0].id) : ''))
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load client accounts.')
      })
      .finally(() => {
        if (active) setIsLoadingUsers(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setPermissions(null)
      setSavedPermissions(null)
      return
    }
    let active = true
    setPermissions(null)
    setSavedPermissions(null)
    setError('')
    setNotice('')
    setIsLoadingPermissions(true)
    adminApi.getUserPermissions(Number(selectedUserId))
      .then((value) => {
        if (active) {
          setPermissions(value)
          setSavedPermissions(value)
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load page permissions.')
      })
      .finally(() => {
        if (active) setIsLoadingPermissions(false)
      })
    return () => {
      active = false
    }
  }, [selectedUserId])

  function updatePermission(page: keyof UserPagePermissions, action: 'view' | 'edit' | 'update', checked: boolean) {
    setPermissions((current) => {
      if (!current) return current
      const next = { ...current, [page]: { ...current[page], [action]: checked } }
      if (action === 'view' && !checked) {
        next[page].edit = false
        next[page].update = false
      } else if (action === 'edit' && !checked) {
        next[page].update = false
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedUserId || !permissions) return
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      await adminApi.updateUserPermissions(Number(selectedUserId), permissions)
      setSavedPermissions(permissions)
      const selectedUser = users.find((user) => String(user.id) === selectedUserId)
      setNotice(`Page access updated for ${selectedUser?.name ?? 'this client'}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save page permissions.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedUser = users.find((user) => String(user.id) === selectedUserId)
  const hasUnsavedChanges = Boolean(
    permissions
    && savedPermissions
    && JSON.stringify(permissions) !== JSON.stringify(savedPermissions),
  )
  const permissionCounts = permissions
    ? (['view', 'edit', 'update'] as const).map((action) =>
        pages.filter(({ key }) => permissions[key][action]).length,
      )
    : [0, 0, 0]

  return (
    <section className="admin-page role-page">
      <div className="role-hero">
        <div className="role-hero-copy">
          <p className="eyebrow">ACCESS MANAGEMENT <span className="role-hero-dot">/</span> CLIENTS</p>
          <h1>Roles &amp; permissions</h1>
          <p className="admin-page-subtitle">Decide which workspace pages each client can access and manage.</p>
        </div>
        <div className="role-secure-badge"><span aria-hidden="true">✓</span> Admin controls</div>
      </div>

      <section className="role-card role-client-card" aria-labelledby="role-client-title">
        <div className="role-section-heading">
          <div className="role-section-icon" aria-hidden="true">01</div>
          <div>
            <p className="eyebrow">PERMISSION TARGET</p>
            <h2 id="role-client-title">Choose a client</h2>
          </div>
        </div>
        {isLoadingUsers ? (
          <div className="role-loading"><span className="role-loading-dot" /> Loading client accounts…</div>
        ) : users.length === 0 ? (
          <div className="role-empty-state">
            <strong>No client accounts yet</strong>
            <p>Create a standard user account in User admin to configure page access.</p>
          </div>
        ) : (
          <div className="role-client-select-row">
            <label className="role-user-select">
              <span>Client account</span>
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} — {user.email}</option>
                ))}
              </select>
            </label>
            {selectedUser && (
              <div className="role-selected-user">
                <span className="role-user-avatar" aria-hidden="true">
                  {selectedUser.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <span><strong>{selectedUser.name}</strong><small>{selectedUser.email}</small></span>
                <span className="role-client-tag">CLIENT</span>
              </div>
            )}
          </div>
        )}
      </section>

      {isLoadingPermissions && (
        <div className="role-loading role-permission-loading"><span className="role-loading-dot" /> Loading permissions…</div>
      )}
      {permissions && (
        <form className="role-card role-access-card" onSubmit={handleSubmit}>
          <div className="role-access-heading">
            <div className="role-section-heading">
              <div className="role-section-icon" aria-hidden="true">02</div>
              <div>
                <p className="eyebrow">PAGE ACCESS</p>
                <h2>Workspace permissions</h2>
              </div>
            </div>
            {hasUnsavedChanges && <span className="role-unsaved-badge">Unsaved changes</span>}
          </div>
          <p className="role-access-description">
            Set what <strong>{selectedUser?.name ?? 'this client'}</strong> can do on each page. Edit requires View; Update requires both.
          </p>

          <div className="role-permission-summary" aria-label="Permission summary">
            {(['View', 'Edit', 'Update'] as const).map((label, index) => (
              <div className="role-summary-item" key={label}>
                <span>{label} access</span>
                <strong>{permissionCounts[index]}<small> / {pages.length} pages</small></strong>
              </div>
            ))}
          </div>

          <div className="role-table-wrap">
            <table className="role-permission-table">
              <thead>
                <tr>
                  <th scope="col">Workspace page</th>
                  <th scope="col"><span className="role-action-title">View<small>Open page</small></span></th>
                  <th scope="col"><span className="role-action-title">Edit<small>Change content</small></span></th>
                  <th scope="col"><span className="role-action-title">Update<small>Save changes</small></span></th>
                </tr>
              </thead>
              <tbody>
                {pages.map(({ key, label, description }) => (
                  <tr key={key}>
                    <th scope="row">
                      <span className="role-page-marker" aria-hidden="true">{label[0]}</span>
                      <span className="role-page-copy"><strong>{label}</strong><small>{description}</small></span>
                    </th>
                    {(['view', 'edit', 'update'] as const).map((action) => (
                      <td key={action}>
                        <label className="role-check-label">
                          <input
                            type="checkbox"
                            aria-label={`${label}: ${action} access`}
                            title={`${action === 'view' ? 'Allow viewing' : action === 'edit' ? 'Allow editing' : 'Allow updates to'} the ${label} page`}
                            checked={permissions[key][action]}
                            disabled={
                              isSaving
                              || (action === 'edit' && !permissions[key].view)
                              || (action === 'update' && !permissions[key].edit)
                            }
                            onChange={(event) => updatePermission(key, action, event.target.checked)}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="role-access-footer">
            <p className="role-security-note"><span aria-hidden="true">i</span> Changes apply to the client’s next page load. Admin pages remain restricted.</p>
            <div className="role-form-actions">
              <button
                className="role-reset-button"
                type="button"
                disabled={!hasUnsavedChanges || isSaving}
                onClick={() => setPermissions(savedPermissions)}
              >
                Discard
              </button>
              <button className="admin-save-button role-save-button" type="submit" disabled={isSaving || !hasUnsavedChanges}>
                <span aria-hidden="true">{isSaving ? '' : '✓'}</span>
                {isSaving ? 'Saving changes…' : 'Save permissions'}
              </button>
            </div>
          </div>
        </form>
      )}

      {notice && <Toast message={notice} type="success" onDismiss={() => setNotice('')} />}
      {error && <Toast message={error} type="error" onDismiss={() => setError('')} />}
    </section>
  )
}

export default RolePage
