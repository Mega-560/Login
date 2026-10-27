import { useMemo, useState, type FormEvent } from 'react'
import Modal from 'react-bootstrap/Modal'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueCategories, catalogueCurrency, catalogueParts, type CataloguePart } from '../data/catalogueParts'

const pageSize = 6

function CatalogueCardsPage() {
  const navigate = useNavigate()
  const { addItem, addItems, itemCount, storageError } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All parts')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activePart, setActivePart] = useState<CataloguePart | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  const filteredParts = useMemo(() => catalogueParts.filter((part) => {
    const matchesCategory = category === 'All parts' || part.category === category
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [part.id, part.name, part.category, part.vehicle].some((value) => value.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  }), [category, search])

  const pageCount = Math.max(1, Math.ceil(filteredParts.length / pageSize))
  const pageParts = filteredParts.slice((page - 1) * pageSize, page * pageSize)

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeCategory(value: string) {
    setCategory(value)
    setPage(1)
  }

  function toggleSelection(partId: string) {
    setSelectedIds((current) => current.includes(partId)
      ? current.filter((id) => id !== partId)
      : [...current, partId])
  }

  function addSelectedToCart() {
    const selectedParts = catalogueParts.filter((part) => selectedIds.includes(part.id))
    if (!selectedParts.length) return
    addItems(selectedParts)
    setNotice(`${selectedParts.length} selected ${selectedParts.length === 1 ? 'part was' : 'parts were'} added to your cart.`)
    setSelectedIds([])
  }

  function openDetails(part: CataloguePart) {
    setActivePart(part)
    setQuantity(1)
  }

  function addCurrentPart(goToCheckout: boolean) {
    if (!activePart) return
    addItem(activePart, quantity)
    if (goToCheckout) {
      setActivePart(null)
      navigate('/checkout')
      return
    }
    setNotice(`${activePart.name} added to your cart.`)
    setActivePart(null)
  }

  function handleBuyNow(part: CataloguePart) {
    addItem(part)
    navigate('/checkout')
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="catalogue-page catalogue-cards-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">NEXUSFLOW / SAMPLE PARTS</p>
          <h1>Browse parts</h1>
          <p>Explore the parts range, check vehicle fitment, and add one or more items to your cart.</p>
        </div>
        <div className="catalogue-heading-actions">
          <Link className="catalogue-card-view-link" to="/catalogue">Table view <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-cart-link" to="/cart" aria-label={`Open cart, ${itemCount} items`}>Cart <span>{itemCount}</span></Link>
          <span className="catalogue-count"><strong>{catalogueParts.length}</strong> parts</span>
        </div>
      </div>

      <div className="catalogue-card-toolbar">
        <div>
          <p className="eyebrow">PARTS COLLECTION</p>
          <h2>Find your fit</h2>
        </div>
        <form className="catalogue-table-filters" onSubmit={submitSearch}>
          <label className="catalogue-search">
            <span className="sr-only">Search parts</span>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6" /><path d="m13 13 4 4" /></svg>
            <input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search catalogue" />
          </label>
          <label className="catalogue-category-filter">
            <span className="sr-only">Filter by category</span>
            <select value={category} onChange={(event) => changeCategory(event.target.value)}>
              {catalogueCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </form>
      </div>

      {selectedIds.length > 0 && (
        <div className="catalogue-selection-bar" role="status">
          <span><strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'part selected' : 'parts selected'}</span>
          <button type="button" className="catalogue-primary-button" onClick={addSelectedToCart}>Add selected to cart</button>
        </div>
      )}
      {storageError && <p className="catalogue-cart-notice" role="alert">{storageError}</p>}
      {notice && <p className="catalogue-cart-notice" role="status">{notice}</p>}

      {pageParts.length ? (
        <div className="catalogue-card-grid">
          {pageParts.map((part) => (
            <article className="catalogue-product-card" key={part.id}>
              <label className="catalogue-card-select" title={`Select ${part.name} for multi-item cart`}>
                <input type="checkbox" checked={selectedIds.includes(part.id)} onChange={() => toggleSelection(part.id)} />
                <span className="sr-only">Select {part.name}</span>
              </label>
              <button className="catalogue-card-image-button" type="button" onClick={() => openDetails(part)} aria-label={`View details for ${part.name}`}>
                <img src={part.image} alt={part.imageAlt} />
                <span className="catalogue-category-tag">{part.category}</span>
              </button>
              <div className="catalogue-product-copy">
                <button className="catalogue-product-title" type="button" onClick={() => openDetails(part)}>{part.name}</button>
                <span className="catalogue-product-number">PART NO. {part.id}</span>
                <p className="catalogue-product-fitment">{part.vehicle}</p>
                <div className="catalogue-product-meta">
                  <strong>{catalogueCurrency.format(part.price)}</strong>
                  <span className={part.stock < 10 ? 'catalogue-product-stock low' : 'catalogue-product-stock'}>
                    {part.stock < 10 ? 'Low stock' : 'In stock'}
                  </span>
                </div>
                <div className="catalogue-card-actions">
                  <button className="catalogue-secondary-button" type="button" onClick={() => openDetails(part)}>Details</button>
                  <button className="catalogue-primary-button" type="button" onClick={() => { addItem(part); setNotice(`${part.name} added to your cart.`) }}>Add to cart</button>
                </div>
                <button className="catalogue-buy-now" type="button" onClick={() => handleBuyNow(part)}>Buy now</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalogue-empty-state">
          <h3>No matching parts</h3>
          <p>Try a different search or category.</p>
          <button type="button" className="catalogue-secondary-button" onClick={() => { changeSearch(''); changeCategory('All parts') }}>Clear filters</button>
        </div>
      )}

      <nav className="catalogue-pagination" aria-label="Catalogue pages">
        <button type="button" className="catalogue-secondary-button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span>Page <strong>{page}</strong> of <strong>{pageCount}</strong></span>
        <button type="button" className="catalogue-secondary-button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
      </nav>

      <Modal
        show={Boolean(activePart)}
        onHide={() => setActivePart(null)}
        centered
        dialogClassName="catalogue-product-modal-dialog"
        contentClassName="catalogue-product-modal"
        backdropClassName="catalogue-modal-backdrop"
        aria-labelledby="catalogue-modal-title"
      >
        {activePart && (
          <>
            <button type="button" className="catalogue-modal-close" aria-label="Close part details" onClick={() => setActivePart(null)}>×</button>
            <div className="catalogue-modal-image"><img src={activePart.image} alt={activePart.imageAlt} /></div>
            <div className="catalogue-modal-copy">
              <span className="catalogue-category-tag">{activePart.category}</span>
              <p className="catalogue-product-number">PART NO. {activePart.id}</p>
              <h2 id="catalogue-modal-title">{activePart.name}</h2>
              <p>{activePart.description}</p>
              <dl className="catalogue-detail-list">
                <div><dt>Vehicle fitment</dt><dd>{activePart.vehicle}</dd></div>
                <div><dt>Warranty</dt><dd>{activePart.warranty}</dd></div>
                <div><dt>Availability</dt><dd>{activePart.stock} units in stock</dd></div>
              </dl>
              <div className="catalogue-modal-purchase">
                <strong>{catalogueCurrency.format(activePart.price)}</strong>
                <label>Quantity
                  <input type="number" min={1} max={activePart.stock} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(activePart.stock, Number(event.target.value) || 1)))} />
                </label>
              </div>
              <div className="catalogue-card-actions">
                <button className="catalogue-secondary-button" type="button" onClick={() => addCurrentPart(false)}>Add to cart</button>
                <button className="catalogue-primary-button" type="button" onClick={() => addCurrentPart(true)}>Buy now</button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </section>
  )
}

export default CatalogueCardsPage
