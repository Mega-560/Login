import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import Toast from './Toast'
import { adminApi, type AdminUser } from '../adminApi'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
])

interface UserForm {
  name: string
  email: string
  password: string
}

const emptyForm: UserForm = { name: '', email: '', password: '' }

function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await adminApi.getUsers())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load user accounts.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    adminApi.getUsers()
      .then((users) => {
        if (active) setUsers(users)
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load user accounts.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columnDefs = useMemo<ColDef<AdminUser>[]>(() => [
    { field: 'id', headerName: 'ID', headerTooltip: 'Unique account identifier', maxWidth: 100 },
    { field: 'name', headerName: 'Name', headerTooltip: 'Client or administrator display name', tooltipField: 'name', minWidth: 180 },
    { field: 'email', headerName: 'Email', headerTooltip: 'Sign-in email address', tooltipField: 'email', minWidth: 240, flex: 1 },
    {
      field: 'role',
      headerName: 'Role',
      headerTooltip: 'Account access role',
      maxWidth: 130,
      cellClass: 'admin-role-cell',
    },
    {
      field: 'created_at',
      headerName: 'Created',
      headerTooltip: 'Date and time the account was created',
      minWidth: 170,
      valueFormatter: ({ value }) => new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value as number)),
    },
    {
      headerName: 'Actions',
      headerTooltip: 'Actions available for this account',
      colId: 'actions',
      sortable: false,
      filter: false,
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: ICellRendererParams<AdminUser>) => {
        const user = params.data
        return user ? (
          <div className="admin-table-actions">
            <button
              className="admin-table-action"
              type="button"
              title={`Edit ${user.name}'s account`}
              onClick={() => {
                setEditingUser(user)
                setForm({ name: user.name, email: user.email, password: '' })
                setNotice('')
              }}
            >
              Edit
            </button>
          </div>
        ) : null
      },
    },
  ], [])

  function resetForm() {
    setEditingUser(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, { name: form.name, email: form.email })
        setNotice('User account updated.')
      } else {
        await adminApi.createUser(form)
        setNotice('User account created.')
      }
      resetForm()
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save this user account.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>User accounts</h1>
          <p className="admin-page-subtitle">View and manage account details and access roles.</p>
        </div>
        <button
          className="admin-add-button"
          type="button"
          onClick={() => {
            resetForm()
            setError('')
            setNotice('')
          }}
        >
          Add user
        </button>
      </div>

      <div className="admin-summary">
        <strong>{users.length}</strong>
        <span>{users.length === 1 ? 'account' : 'accounts'}</span>
      </div>

      <div className="admin-grid ag-theme-quartz">
        <AgGridReact<AdminUser>
          rowData={users}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          theme={themeQuartz}
          tooltipShowDelay={400}
          loading={isLoading}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          getRowId={({ data }) => String(data.id)}
          overlayNoRowsTemplate="No user accounts found."
        />
      </div>

      {notice && <Toast message={notice} type="success" onDismiss={() => setNotice('')} />}

      <form className="admin-user-form" onSubmit={handleSubmit}>
        <div className="admin-form-heading">
          <div>
            <p className="eyebrow">{editingUser ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</p>
            <h2>{editingUser ? `Update ${editingUser.name}` : 'Add a user account'}</h2>
          </div>
          {editingUser && <button className="admin-cancel-button" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <div className="admin-form-fields">
          <label>
            Name
            <input
              autoComplete="name"
              maxLength={80}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          {!editingUser && (
            <label>
              Temporary password
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
          )}
        </div>
        <p className="admin-form-help">
          {editingUser
            ? 'Email changes revoke existing sessions and clear pending password recovery.'
            : 'The password must be at least 12 characters. New accounts start with standard user access.'}
        </p>
        <button className="admin-save-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : editingUser ? 'Save changes' : 'Create account'}
        </button>
      </form>

      {error && <Toast message={error} type="error" onDismiss={() => setError('')} />}
    </section>
  )
}

export default AdminPage
