import { useEffect, useState, type FormEvent } from 'react'
import { adminApi, type AdminCataloguePart } from '../adminApi'
import './CatalogueOperations.css'

interface PartDraft {
  id: string
  name: string
  category: string
  vehicle: string
  price: string
  stock: string
  warranty: string
  image: string
  imageAlt: string
  description: string
}

const emptyDraft: PartDraft = {
  id: '',
  name: '',
  category: '',
  vehicle: '',
  price: '',
  stock: '',
  warranty: '',
  image: '',
  imageAlt: '',
  description: '',
}

function draftFromPart(part: AdminCataloguePart): PartDraft {
  return {
    id: part.id,
    name: part.name,
    category: part.category,
    vehicle: part.vehicle,
    price: String(part.price),
    stock: String(part.stock),
    warranty: part.warranty,
    image: part.image,
    imageAlt: part.imageAlt,
    description: part.description,
  }
}

function CataloguePartsPage() {
  const [parts, setParts] = useState<AdminCataloguePart[]>([])
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    adminApi.getCatalogueParts()
      .then((loadedParts) => {
        if (active) setParts(loadedParts)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load catalogue parts.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function resetForm() {
    setDraft(emptyDraft)
    setEditingId('')
  }

  async function savePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      const saved = await adminApi.saveCataloguePart({
        ...draft,
        id: draft.id.trim(),
        name: draft.name.trim(),
        category: draft.category.trim(),
        vehicle: draft.vehicle.trim(),
        price: Number(draft.price),
        stock: Number(draft.stock),
        warranty: draft.warranty.trim(),
        image: draft.image.trim(),
        imageAlt: draft.imageAlt.trim(),
        description: draft.description.trim(),
      }, Boolean(editingId))
      setParts((current) => {
        const next = current.filter((part) => part.id !== saved.part.id)
        return [...next, saved.part].sort((a, b) => a.name.localeCompare(b.name))
      })
      setNotice(editingId ? 'Catalogue part updated.' : 'Catalogue part created.')
      resetForm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this catalogue part.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActive(part: AdminCataloguePart) {
    setError('')
    setNotice('')
    try {
      await adminApi.setCataloguePartActive(part.id, !part.active)
      setParts((current) => current.map((item) => item.id === part.id ? { ...item, active: !item.active } : item))
      setNotice(`${part.name} is now ${part.active ? 'hidden from' : 'visible in'} the client catalogue.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update catalogue availability.')
    }
  }

  return (
    <section className="admin-page catalogue-operations">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">PRODUCT LIBRARY / INVENTORY</p>
          <h1>Catalogue parts</h1>
          <p className="admin-page-subtitle">Manage the live products, pricing, fitment, and stock shown to clients.</p>
        </div>
      </header>

      <div className="admin-dashboard-stats">
        <article className="admin-dashboard-stat"><span>ALL PARTS</span><strong>{parts.length}</strong></article>
        <article className="admin-dashboard-stat"><span>AVAILABLE</span><strong>{parts.filter((part) => part.active).length}</strong></article>
        <article className="admin-dashboard-stat"><span>LOW STOCK</span><strong>{parts.filter((part) => part.active && part.stock < 10).length}</strong></article>
      </div>

      {error && <p className="catalogue-operations-feedback is-error" role="alert">{error}</p>}
      {notice && <p className="catalogue-operations-feedback" role="status">{notice}</p>}

      <div className="catalogue-operations-table-wrap">
        <table className="catalogue-operations-table">
          <thead><tr><th>Part</th><th>Category / vehicle</th><th>Price</th><th>Stock</th><th>Client listing</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={6}>Loading catalogue parts…</td></tr>
              : parts.length === 0
                ? <tr><td colSpan={6}>No catalogue parts found. Add the first part below.</td></tr>
                : parts.map((part) => (
                  <tr key={part.id}>
                    <td><strong>{part.name}</strong><small>{part.id}</small></td>
                    <td>{part.category}<small>{part.vehicle}</small></td>
                    <td>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(part.price)}</td>
                    <td>{part.stock}</td>
                    <td><span className={`catalogue-status-tag${part.active ? ' is-active' : ''}`}>{part.active ? 'Available' : 'Hidden'}</span></td>
                    <td>
                      <div className="catalogue-operations-actions">
                        <button type="button" onClick={() => { setEditingId(part.id); setDraft(draftFromPart(part)); setError(''); setNotice('') }}>Edit</button>
                        <button type="button" onClick={() => void toggleActive(part)}>{part.active ? 'Hide' : 'Publish'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <form className="catalogue-part-form" onSubmit={(event) => void savePart(event)}>
        <div className="admin-form-heading">
          <p className="eyebrow">{editingId ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</p>
          <h2>{editingId ? `Update ${editingId}` : 'Add a catalogue part'}</h2>
        </div>
        <div className="catalogue-part-fields">
          <label>Part number<input required maxLength={40} value={draft.id} disabled={Boolean(editingId)} onChange={(event) => setDraft({ ...draft, id: event.target.value })} /></label>
          <label>Product name<input required maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Category<input required maxLength={80} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
          <label>Vehicle fitment<input required maxLength={160} value={draft.vehicle} onChange={(event) => setDraft({ ...draft, vehicle: event.target.value })} /></label>
          <label>Price (USD)<input required type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
          <label>Stock quantity<input required type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} /></label>
          <label>Warranty<input required maxLength={60} value={draft.warranty} onChange={(event) => setDraft({ ...draft, warranty: event.target.value })} /></label>
          <label>Image path or URL<input required maxLength={500} value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></label>
          <label>Image description<input required maxLength={180} value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} /></label>
          <label className="catalogue-part-description">Description<textarea required maxLength={1000} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        </div>
        <div className="catalogue-part-form-actions">
          <button type="submit" className="admin-add-button" disabled={isSaving}>{isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create part'}</button>
          {editingId && <button type="button" className="admin-cancel-button" onClick={resetForm} disabled={isSaving}>Cancel edit</button>}
        </div>
      </form>
    </section>
  )
}

export default CataloguePartsPage
