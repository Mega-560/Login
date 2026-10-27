import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { catalogueCurrency, catalogueParts } from '../data/catalogueParts'

function CataloguePdfPage() {
  useEffect(() => {
    document.body.classList.add('catalogue-print-mode')
    return () => document.body.classList.remove('catalogue-print-mode')
  }, [])

  return (
    <section className="catalogue-page catalogue-pdf-page">
      <div className="catalogue-pdf-actions">
        <Link className="catalogue-secondary-button" to="/catalogue">← Back to catalogue</Link>
        <button className="catalogue-primary-button" type="button" onClick={() => window.print()}>
          <span aria-hidden="true">▤</span> Print / Save as PDF
        </button>
      </div>

      <header className="catalogue-pdf-cover">
        <div>
          <p className="eyebrow">NEXUSFLOW / SAMPLE PARTS</p>
          <h1>Parts catalogue</h1>
          <p>Product descriptions, vehicle fitment, pricing, availability, and warranty information.</p>
        </div>
        <div className="catalogue-pdf-cover-meta">
          <strong>{catalogueParts.length}</strong>
          <span>catalogue parts</span>
          <small>Prices shown in USD</small>
        </div>
      </header>

      <div className="catalogue-pdf-notice">
        Sample catalogue data for preview. Confirm fitment and availability before purchase.
      </div>

      <div className="catalogue-pdf-products">
        {catalogueParts.map((part, index) => (
          <article className="catalogue-pdf-product" key={part.id}>
            <div className="catalogue-pdf-product-image">
              <img src={part.image} alt={part.imageAlt} />
            </div>
            <div className="catalogue-pdf-product-content">
              <div className="catalogue-pdf-product-heading">
                <span>{part.category}</span>
                <small>{String(index + 1).padStart(2, '0')} / {String(catalogueParts.length).padStart(2, '0')}</small>
              </div>
              <h2>{part.name}</h2>
              <p className="catalogue-pdf-part-number">PART NO. {part.id}</p>
              <p className="catalogue-pdf-description">{part.description}</p>
              <dl className="catalogue-pdf-specs">
                <div><dt>Vehicle fitment</dt><dd>{part.vehicle}</dd></div>
                <div><dt>Stock</dt><dd>{part.stock} units</dd></div>
                <div><dt>Warranty</dt><dd>{part.warranty}</dd></div>
              </dl>
              <div className="catalogue-pdf-price">
                <span>Retail price</span>
                <strong>{catalogueCurrency.format(part.price)}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="catalogue-pdf-footer">
        NexusFlow sample catalogue · Prices in USD · Availability may change
      </footer>
    </section>
  )
}

export default CataloguePdfPage
