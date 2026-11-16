import { useEffect, useState, type FormEvent } from 'react'
import { adminApi, type AdminBusinessPartner, type BusinessPartnerInput } from '../adminApi'
import './CatalogueOperations.css'

const emptyPartner: BusinessPartnerInput = {
  name: '',
  type: 'dealer',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
}

function BusinessPartnersPage() {
  const [partners, setPartners] = useState<AdminBusinessPartner[]>([])
  const [partner, setPartner] = useState<BusinessPartnerInput>(emptyPartner)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyPartnerId, setBusyPartnerId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    adminApi.getBusinessPartners()
      .then((loadedPartners) => {
        if (active) setPartners(loadedPartners)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load dealer and retailer records.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function resetForm() {
    setPartner(emptyPartner)
    setEditingId(null)
  }

  async function savePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      const saved = await adminApi.saveBusinessPartner(partner, editingId ?? undefined)
      setPartners((current) => editingId
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
      setNotice(`${saved.type === 'dealer' ? 'Dealer' : 'Retailer'} ${saved.name} ${editingId ? 'updated' : 'added'}.`)
      resetForm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this partner.')
    } finally {
      setIsSaving(false)
    }
  }

  function editPartner(item: AdminBusinessPartner) {
    setPartner({
      name: item.name,
      type: item.type,
      contactName: item.contactName,
      email: item.email,
      phone: item.phone,
      address: item.address,
      notes: item.notes,
    })
    setEditingId(item.id)
    setError('')
    setNotice('')
  }

  async function toggleActive(item: AdminBusinessPartner) {
    setError('')
    setNotice('')
    setBusyPartnerId(item.id)
    try {
      await adminApi.setBusinessPartnerActive(item.id, !item.active)
      setPartners((current) => current.map((entry) => entry.id === item.id ? { ...entry, active: !item.active } : entry))
      setNotice(`${item.name} ${item.active ? 'deactivated' : 'activated'}.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this partner.')
    } finally {
      setBusyPartnerId('')
    }
  }

  return (
    <section className="admin-page catalogue-operations">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">SALES / PARTNERS</p>
          <h1>Dealers &amp; retailers</h1>
          <p className="admin-page-subtitle">Maintain business contacts and assign active partners to customer shipments.</p>
        </div>
      </header>

      {error && <p className="catalogue-operations-feedback is-error" role="alert">{error}</p>}
      {notice && <p className="catalogue-operations-feedback" role="status">{notice}</p>}

      <form className="catalogue-part-form" onSubmit={(event) => void savePartner(event)}>
        <header className="admin-form-heading">
          <div>
            <h2>{editingId ? 'Edit partner' : 'Add a business partner'}</h2>
            <p className="admin-page-subtitle">Store contact and delivery coordination information.</p>
          </div>
        </header>
        <div className="partner-form-fields">
          <label>Business name
            <input required maxLength={120} value={partner.name} onChange={(event) => setPartner({ ...partner, name: event.target.value })} />
          </label>
          <label>Partner type
            <select value={partner.type} onChange={(event) => setPartner({ ...partner, type: event.target.value as BusinessPartnerInput['type'] })}>
              <option value="dealer">Dealer</option>
              <option value="retailer">Retailer</option>
            </select>
          </label>
          <label>Contact person
            <input maxLength={120} value={partner.contactName} onChange={(event) => setPartner({ ...partner, contactName: event.target.value })} />
          </label>
          <label>Email
            <input type="email" maxLength={254} value={partner.email} onChange={(event) => setPartner({ ...partner, email: event.target.value })} />
          </label>
          <label>Phone
            <input type="tel" maxLength={40} value={partner.phone} onChange={(event) => setPartner({ ...partner, phone: event.target.value })} />
          </label>
          <label>Business address
            <input maxLength={500} value={partner.address} onChange={(event) => setPartner({ ...partner, address: event.target.value })} />
          </label>
          <label className="partner-form-notes">Notes
            <textarea maxLength={1000} value={partner.notes} onChange={(event) => setPartner({ ...partner, notes: event.target.value })} rows={3} />
          </label>
        </div>
        <div className="partner-form-actions">
          <button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Add partner'}</button>
          {editingId && <button type="button" disabled={isSaving} onClick={resetForm}>Cancel editing</button>}
        </div>
      </form>

      {isLoading ? <p className="catalogue-operations-empty">Loading business partners…</p>
        : partners.length === 0
          ? <p className="catalogue-operations-empty">No dealers or retailers have been added yet.</p>
          : <div className="catalogue-operations-table-wrap">
            <table className="catalogue-operations-table">
              <thead><tr><th>Business</th><th>Contact</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {partners.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.type} · {item.id}</small></td>
                    <td>{item.contactName || '—'}<small>{item.email || item.phone || 'No contact details'}</small></td>
                    <td>{item.address || '—'}{item.notes && <small>{item.notes}</small>}</td>
                    <td><span className={`catalogue-status-tag${item.active ? ' is-active' : ''}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="catalogue-operations-actions">
                        <button type="button" onClick={() => editPartner(item)}>Edit</button>
                        <button type="button" disabled={busyPartnerId === item.id} onClick={() => void toggleActive(item)}>
                          {busyPartnerId === item.id ? 'Saving…' : item.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
    </section>
  )
}

export default BusinessPartnersPage
