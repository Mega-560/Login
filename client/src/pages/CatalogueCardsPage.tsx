import { useMemo, useState, type FormEvent } from 'react'
import Modal from 'react-bootstrap/Modal'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueCurrency, type CataloguePart } from '../data/catalogueParts'
import { useLanguage } from '../LanguageContext'

const pageSize = 6

function CatalogueCardsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { addItem, addItems, itemCount, storageError, catalogueParts, catalogueLoading, catalogueError } = useCart()
  const catalogueCategories = useMemo(
    () => ['All parts', ...new Set(catalogueParts.map(({ category }) => category))],
    [catalogueParts],
  )
  const [search, setSearch] = useState(
    (location.state as { globalSearch?: string } | null)?.globalSearch ?? '',
  )
  const [category, setCategory] = useState('All parts')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activePart, setActivePart] = useState<CataloguePart | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  const filteredParts = useMemo(() => catalogueParts.filter((part) => {
    const matchesCategory = category === 'All parts' || part.category === category
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [part.id, part.name, part.category, part.vehicle, part.description, part.warranty, part.imageAlt]
      .some((value) => value.toLocaleLowerCase().includes(query))
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
    setNotice(t(selectedParts.length === 1 ? 'One selected part was added to your cart.' : 'Selected parts were added to your cart.'))
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
    setNotice(`${t('Added to your cart:')} ${activePart.name}`)
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
          <p className="eyebrow">{t('NEXUSFLOW / PARTS CATALOGUE')}</p>
          <h1>{t('Browse parts')}</h1>
          <p>{t('Explore the parts range, check vehicle fitment, and add one or more items to your cart.')}</p>
        </div>
        <div className="catalogue-heading-actions">
          <Link className="catalogue-card-view-link" to="/catalogue">{t('Table view')} <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-cart-link" to="/cart" aria-label={`${t('Open cart')}, ${itemCount} ${t('items')}`}>{t('Cart')} <span>{itemCount}</span></Link>
          <span className="catalogue-count"><strong>{catalogueParts.length}</strong> {t('parts')}</span>
        </div>
      </div>

      {catalogueLoading && <p className="catalogue-feedback" role="status">{t('Loading current inventory…')}</p>}
      {catalogueError && <p className="catalogue-feedback error" role="alert">{catalogueError}</p>}

      <div className="catalogue-card-toolbar">
        <div>
          <p className="eyebrow">{t('PARTS COLLECTION')}</p>
          <h2>{t('Find your fit')}</h2>
        </div>
        <form className="catalogue-table-filters" onSubmit={submitSearch}>
          <label className="catalogue-search">
            <span className="sr-only">{t('Search parts')}</span>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6" /><path d="m13 13 4 4" /></svg>
            <input value={search} onChange={(event) => changeSearch(event.target.value)} placeholder={t('Search catalogue')} />
          </label>
          <label className="catalogue-category-filter">
            <span className="sr-only">{t('Filter by category')}</span>
            <select value={category} onChange={(event) => changeCategory(event.target.value)}>
              {catalogueCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </form>
      </div>

      {selectedIds.length > 0 && (
        <div className="catalogue-selection-bar" role="status">
          <span><strong>{selectedIds.length}</strong> {t(selectedIds.length === 1 ? 'part selected' : 'parts selected')}</span>
          <button type="button" className="catalogue-primary-button" onClick={addSelectedToCart}>{t('Add selected to cart')}</button>
        </div>
      )}
      {storageError && <p className="catalogue-cart-notice" role="alert">{storageError}</p>}
      {notice && <p className="catalogue-cart-notice" role="status">{notice}</p>}

      {pageParts.length ? (
        <div className="catalogue-card-grid">
          {pageParts.map((part) => (
            <article className="catalogue-product-card" key={part.id}>
              <label className="catalogue-card-select" title={`${t('Select')} ${part.name} ${t('for multi-item cart')}`}>
                <input type="checkbox" checked={selectedIds.includes(part.id)} onChange={() => toggleSelection(part.id)} />
                <span className="sr-only">{t('Select')} {part.name}</span>
              </label>
              <button className="catalogue-card-image-button" type="button" onClick={() => openDetails(part)} aria-label={`${t('View details for')} ${part.name}`}>
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
                    {t(part.stock < 10 ? 'Low stock' : 'In stock')}
                  </span>
                </div>
                <div className="catalogue-card-actions">
                  <button className="catalogue-secondary-button" type="button" onClick={() => openDetails(part)}>{t('Details')}</button>
                  <button className="catalogue-primary-button" type="button" onClick={() => { addItem(part); setNotice(`${t('Added to your cart:')} ${part.name}`) }}>{t('Add to cart')}</button>
                </div>
                <button className="catalogue-buy-now" type="button" onClick={() => handleBuyNow(part)}>{t('Buy now')}</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalogue-empty-state">
          <h3>{t('No matching parts')}</h3>
          <p>{t('Try a different search or category.')}</p>
          <button type="button" className="catalogue-secondary-button" onClick={() => { changeSearch(''); changeCategory('All parts') }}>{t('Clear filters')}</button>
        </div>
      )}

      <nav className="catalogue-pagination" aria-label={t('Catalogue pages')}>
        <button type="button" className="catalogue-secondary-button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('Previous')}</button>
        <span>{t('Page')} <strong>{page}</strong> {t('of')} <strong>{pageCount}</strong></span>
        <button type="button" className="catalogue-secondary-button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>{t('Next')}</button>
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
            <button type="button" className="catalogue-modal-close" aria-label={t('Close part details')} onClick={() => setActivePart(null)}>×</button>
            <div className="catalogue-modal-image"><img src={activePart.image} alt={activePart.imageAlt} /></div>
            <div className="catalogue-modal-copy">
              <span className="catalogue-category-tag">{activePart.category}</span>
              <p className="catalogue-product-number">PART NO. {activePart.id}</p>
              <h2 id="catalogue-modal-title">{activePart.name}</h2>
              <p>{activePart.description}</p>
              <dl className="catalogue-detail-list">
                <div><dt>{t('Vehicle fitment')}</dt><dd>{activePart.vehicle}</dd></div>
                <div><dt>{t('Warranty')}</dt><dd>{activePart.warranty}</dd></div>
                <div><dt>{t('Availability')}</dt><dd>{activePart.stock} {t('units in stock')}</dd></div>
              </dl>
              <div className="catalogue-modal-purchase">
                <strong>{catalogueCurrency.format(activePart.price)}</strong>
                <label>{t('Quantity')}
                  <input type="number" min={1} max={activePart.stock} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(activePart.stock, Number(event.target.value) || 1)))} />
                </label>
              </div>
              <div className="catalogue-card-actions">
                <button className="catalogue-secondary-button" type="button" onClick={() => addCurrentPart(false)}>{t('Add to cart')}</button>
                <button className="catalogue-primary-button" type="button" onClick={() => addCurrentPart(true)}>{t('Buy now')}</button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </section>
  )
}

export default CatalogueCardsPage
