import { useMemo, useState } from 'react'
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
  themeQuartz,
  type ColDef,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import Modal from 'react-bootstrap/Modal'
import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueCurrency, type CataloguePart } from '../data/catalogueParts'
import { useLanguage } from '../LanguageContext'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
])

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function CatalogueInventoryPage() {
  const { t } = useLanguage()
  const { catalogueParts, catalogueLoading, catalogueError } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All parts')
  const [activePart, setActivePart] = useState<CataloguePart | null>(null)
  const [pdfError, setPdfError] = useState('')
  const catalogueCategories = useMemo(
    () => ['All parts', ...new Set(catalogueParts.map(({ category }) => category))],
    [catalogueParts],
  )

  const filteredParts = useMemo(() => catalogueParts.filter((part) => {
    const matchesCategory = category === 'All parts' || part.category === category
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [
      part.id,
      part.name,
      part.description,
      part.category,
      part.vehicle,
      part.warranty,
    ].some((value) => value.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  }), [catalogueParts, category, search])

  const columnDefs = useMemo<ColDef<CataloguePart>[]>(() => [
    {
      colId: 'image',
      headerName: t('IMAGE'),
      sortable: false,
      filter: false,
      minWidth: 105,
      maxWidth: 115,
      cellRenderer: ({ data }: { data?: CataloguePart }) => data
        ? (
          <button
            className="catalogue-grid-image-button"
            type="button"
            aria-label={`${t('Preview')} ${data.name}`}
            title={`${t('Preview')} ${data.name}`}
            onClick={(event) => {
              event.stopPropagation()
              setPdfError('')
              setActivePart(data)
            }}
          >
            <img className="catalogue-grid-image" src={data.image} alt={data.imageAlt} />
          </button>
        )
        : null,
    },
    { field: 'id', headerName: t('PART NUMBER'), tooltipField: 'id', minWidth: 145 },
    { field: 'name', headerName: t('PRODUCT'), tooltipField: 'name', minWidth: 195, flex: 1 },
    { field: 'description', headerName: t('DESCRIPTION'), tooltipField: 'description', minWidth: 245, flex: 1 },
    { field: 'category', headerName: t('CATEGORY'), tooltipField: 'category', minWidth: 140 },
    { field: 'vehicle', headerName: t('VEHICLE FITMENT'), tooltipField: 'vehicle', minWidth: 190 },
    {
      field: 'price',
      headerName: t('PRICE'),
      minWidth: 125,
      filter: 'agNumberColumnFilter',
      tooltipValueGetter: ({ value }) => catalogueCurrency.format(Number(value)),
      valueFormatter: ({ value }) => catalogueCurrency.format(Number(value ?? 0)),
    },
    {
      field: 'stock',
      headerName: t('STOCK'),
      minWidth: 105,
      filter: 'agNumberColumnFilter',
      tooltipValueGetter: ({ value }) => `${value} ${t('units available')}`,
      cellClass: ({ value }) => Number(value) < 10 ? 'catalogue-stock-low' : 'catalogue-stock-ready',
      valueFormatter: ({ value }) => `${value} ${t('units')}`,
    },
    { field: 'warranty', headerName: t('WARRANTY'), tooltipField: 'warranty', minWidth: 125 },
  ], [t])

  function exportProductPdf(part: CataloguePart) {
    setPdfError('')
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setPdfError(t('Your browser blocked the PDF preview. Allow pop-ups for this site and try again.'))
      return
    }
    printWindow.opener = null

    const imageUrl = escapeHtml(new URL(part.image, window.location.origin).href)
    const html = `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${escapeHtml(part.name)} · Product sheet</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 48px; color: #26382e; font: 14px/1.6 "Segoe UI", Arial, sans-serif; }
            main { max-width: 900px; margin: 0 auto; }
            header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 20px; border-bottom: 2px solid #285246; }
            .eyebrow { color: #668070; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; }
            h1 { margin: 6px 0; font: 34px/1.15 Georgia, serif; }
            .part-number { color: #768279; font-size: 11px; }
            .content { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; padding: 30px 0; }
            img { display: block; width: 100%; max-height: 390px; object-fit: contain; }
            .image { display: grid; min-height: 360px; place-items: center; padding: 20px; background: #f0f3ef; }
            p { color: #59685e; }
            dl { margin: 24px 0; }
            dl div { display: flex; justify-content: space-between; gap: 20px; padding: 10px 0; border-top: 1px solid #e2e7df; }
            dt { color: #768279; } dd { margin: 0; font-weight: 650; text-align: right; }
            .price { margin-top: 20px; font-size: 26px; font-weight: 700; }
            footer { padding-top: 14px; border-top: 1px solid #e2e7df; color: #768279; font-size: 10px; }
            @page { margin: 16mm; }
            @media print { body { padding: 0; } }
            @media (max-width: 620px) { body { padding: 20px; } .content { grid-template-columns: 1fr; } .image { min-height: 250px; } }
          </style>
        </head>
        <body>
          <main>
            <header>
              <div><div class="eyebrow">${escapeHtml(t('NEXUSFLOW / PRODUCT SHEET'))}</div><h1>${escapeHtml(part.name)}</h1><div class="part-number">${escapeHtml(t('PART NO.'))} ${escapeHtml(part.id)}</div></div>
              <div class="eyebrow">${escapeHtml(part.category)}</div>
            </header>
            <section class="content">
              <div class="image"><img src="${imageUrl}" alt="${escapeHtml(part.imageAlt)}"></div>
              <div>
                <p>${escapeHtml(part.description)}</p>
                <dl>
                  <div><dt>${escapeHtml(t('Vehicle fitment'))}</dt><dd>${escapeHtml(part.vehicle)}</dd></div>
                  <div><dt>${escapeHtml(t('Stock available'))}</dt><dd>${part.stock} ${escapeHtml(t('units'))}</dd></div>
                  <div><dt>${escapeHtml(t('Warranty'))}</dt><dd>${escapeHtml(part.warranty)}</dd></div>
                </dl>
                <div class="eyebrow">${escapeHtml(t('RETAIL PRICE'))}</div>
                <div class="price">${escapeHtml(catalogueCurrency.format(part.price))}</div>
              </div>
            </section>
            <footer>${escapeHtml(t('NexusFlow parts catalogue · Prices in USD · Availability may change'))}</footer>
          </main>
        </body>
      </html>`

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    const image = printWindow.document.querySelector('img')
    const printWhenReady = () => {
      printWindow.focus()
      printWindow.print()
    }
    if (image?.complete && image.naturalWidth > 0) {
      printWhenReady()
    } else if (image?.complete) {
      setPdfError(t('The product image could not be loaded for the PDF preview.'))
    } else if (image) {
      image.addEventListener('load', printWhenReady, { once: true })
      image.addEventListener('error', () => {
        setPdfError(t('The product image could not be loaded for the PDF preview.'))
      }, { once: true })
    } else {
      setPdfError(t('The product image could not be loaded for the PDF preview.'))
    }
  }

  const lowStockCount = catalogueParts.filter(({ stock }) => stock < 10).length
  const inventoryValue = catalogueParts.reduce((total, part) => total + part.price * part.stock, 0)

  return (
    <section className="catalogue-page catalogue-inventory-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">{t('NEXUSFLOW / PRODUCT INVENTORY')}</p>
          <h1>{t('Product inventory')}</h1>
          <p>{t('One clear view of every part, its fitment, price, stock, and warranty.')}</p>
        </div>
        <div className="catalogue-heading-actions">
          <Link className="catalogue-card-view-link" to="/catalogue">{t('Featured catalogue')} <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-card-view-link" to="/catalogue/cards">{t('Browse cards')} <span aria-hidden="true">→</span></Link>
          <span className="catalogue-count"><strong>{catalogueParts.length}</strong> {t('products')}</span>
        </div>
      </div>

      {catalogueLoading && <p className="catalogue-feedback" role="status">{t('Loading current inventory…')}</p>}
      {catalogueError && <p className="catalogue-feedback error" role="alert">{catalogueError}</p>}
      <div className="catalogue-inventory-summary" aria-label={t('Inventory summary')}>
        <article><span>{t('PRODUCTS')}</span><strong>{catalogueParts.length}</strong><small>{t('Across')} {catalogueCategories.length - 1} {t('categories')}</small></article>
        <article><span>{t('LOW STOCK')}</span><strong>{lowStockCount}</strong><small>{t('Fewer than 10 units available')}</small></article>
        <article><span>{t('STOCK VALUE')}</span><strong>{catalogueCurrency.format(inventoryValue)}</strong><small>{t('Based on retail price and stock')}</small></article>
      </div>

      <section className="catalogue-table-section" aria-labelledby="catalogue-inventory-title">
        <div className="catalogue-table-heading">
          <div>
            <p className="eyebrow">{t('COMPLETE PRODUCT RANGE')}</p>
            <h2 id="catalogue-inventory-title">{t('Inventory list')}</h2>
          </div>
          <div className="catalogue-table-filters">
            <label className="catalogue-search">
              <span className="sr-only">{t('Search products')}</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6" /><path d="m13 13 4 4" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search products')} title={t('Search product names, numbers, descriptions, fitment, or warranty')} />
            </label>
            <label className="catalogue-category-filter">
              <span className="sr-only">{t('Filter by category')}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} title={t('Filter products by category')}>
                {catalogueCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="catalogue-grid catalogue-inventory-grid ag-theme-quartz">
          <AgGridReact<CataloguePart>
            rowData={filteredParts}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            theme={themeQuartz}
            tooltipShowDelay={400}
            pagination
            paginationPageSize={8}
            paginationPageSizeSelector={[8, 16, 32]}
            getRowId={({ data }) => data.id}
            rowHeight={62}
            headerHeight={48}
            overlayNoRowsTemplate={t('No matching products found.')}
          />
        </div>
        <p className="catalogue-grid-hint">{t('Click any product image to preview its product sheet and print or save it as a PDF.')}</p>
      </section>

      <Modal
        show={Boolean(activePart)}
        onHide={() => setActivePart(null)}
        centered
        dialogClassName="catalogue-product-modal-dialog"
        contentClassName="catalogue-product-modal catalogue-image-preview"
        backdropClassName="catalogue-modal-backdrop"
        aria-labelledby="catalogue-preview-title"
      >
        {activePart && (
          <>
            <button type="button" className="catalogue-modal-close" aria-label={t('Close product preview')} onClick={() => setActivePart(null)}>×</button>
            <div className="catalogue-modal-image"><img src={activePart.image} alt={activePart.imageAlt} /></div>
            <div className="catalogue-modal-copy">
              <span className="catalogue-category-tag">{activePart.category}</span>
              <p className="catalogue-product-number">PART NO. {activePart.id}</p>
              <h2 id="catalogue-preview-title">{activePart.name}</h2>
              <p>{activePart.description}</p>
              <dl className="catalogue-detail-list">
                <div><dt>{t('Vehicle fitment')}</dt><dd>{activePart.vehicle}</dd></div>
                <div><dt>{t('Availability')}</dt><dd>{activePart.stock} {t('units in stock')}</dd></div>
                <div><dt>{t('Warranty')}</dt><dd>{activePart.warranty}</dd></div>
              </dl>
              <div className="catalogue-inventory-preview-price">
                <span>{t('Retail price')}</span>
                <strong>{catalogueCurrency.format(activePart.price)}</strong>
              </div>
              {pdfError && <p className="catalogue-pdf-error" role="alert">{pdfError}</p>}
              <button className="catalogue-primary-button catalogue-inventory-export" type="button" onClick={() => exportProductPdf(activePart)}>
                {t('Print / Save product as PDF')}
              </button>
              <small className="catalogue-inventory-print-hint">{t('Choose “Save as PDF” in your browser’s print dialog.')}</small>
            </div>
          </>
        )}
      </Modal>
    </section>
  )
}

export default CatalogueInventoryPage
