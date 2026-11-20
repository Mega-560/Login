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
  type RowClickedEvent,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { Link } from 'react-router-dom'
import { catalogueCurrency, type CataloguePart } from '../data/catalogueParts'
import { useCart } from '../cart/CartContext'
import { useLanguage } from '../LanguageContext'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
])

function createColumnDefs(t: (text: string) => string): ColDef<CataloguePart>[] {
  return [
    {
      colId: 'image',
      headerName: t('IMAGE'),
      headerTooltip: t('Catalogue part image'),
      sortable: false,
      filter: false,
      minWidth: 95,
      maxWidth: 105,
      cellRenderer: ({ data }: { data?: CataloguePart }) => data
        ? <img className="catalogue-grid-image" src={data.image} alt={data.imageAlt} />
        : null,
    },
    { field: 'id', headerName: t('PART NUMBER'), headerTooltip: t('Unique catalogue part number'), tooltipField: 'id', minWidth: 140 },
    { field: 'name', headerName: t('PART DETAILS'), headerTooltip: t('Name of the replacement part'), tooltipField: 'name', minWidth: 210, flex: 1 },
    { field: 'description', headerName: t('DESCRIPTION'), headerTooltip: t('Product description and key features'), tooltipField: 'description', minWidth: 250, flex: 1 },
    { field: 'category', headerName: t('CATEGORY'), headerTooltip: t('Part system or product category'), tooltipField: 'category', minWidth: 135 },
    { field: 'vehicle', headerName: t('VEHICLE FITMENT'), headerTooltip: t('Vehicle models this part fits'), tooltipField: 'vehicle', minWidth: 195 },
    {
      field: 'price',
      headerName: t('PRICE'),
      headerTooltip: t('Retail price in US dollars'),
      tooltipValueGetter: ({ value }) => catalogueCurrency.format(Number(value)),
      minWidth: 120,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => catalogueCurrency.format(value as number),
    },
    {
      field: 'stock',
      headerName: t('IN STOCK'),
      headerTooltip: t('Number of units currently available'),
      tooltipValueGetter: ({ value }) => `${value} ${t('units available')}`,
      minWidth: 115,
      filter: 'agNumberColumnFilter',
      cellClass: ({ value }) => Number(value) < 10 ? 'catalogue-stock-low' : 'catalogue-stock-ready',
    },
    { field: 'warranty', headerName: t('WARRANTY'), headerTooltip: t('Manufacturer parts warranty'), tooltipField: 'warranty', minWidth: 125 },
  ]
}

function CataloguePage() {
  const { t, language } = useLanguage()
  const columnDefs = useMemo(() => createColumnDefs(t), [t])
  const [activePart, setActivePart] = useState<CataloguePart | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All parts')
  const { itemCount, catalogueParts, catalogueLoading, catalogueError } = useCart()
  const catalogueCategories = useMemo(
    () => ['All parts', ...new Set(catalogueParts.map(({ category }) => category))],
    [catalogueParts],
  )
  const featuredPart = activePart ?? catalogueParts[0]

  const filteredParts = useMemo(
    () => category === 'All parts' ? catalogueParts : catalogueParts.filter((part) => part.category === category),
    [catalogueParts, category],
  )

  function showPart(index: number) {
    if (!catalogueParts.length) return
    const nextIndex = (index + catalogueParts.length) % catalogueParts.length
    setActiveIndex(nextIndex)
    setActivePart(catalogueParts[nextIndex])
  }

  function selectGridPart(event: RowClickedEvent<CataloguePart>) {
    if (!event.data) return
    setActivePart(event.data)
    setActiveIndex(catalogueParts.findIndex(({ id }) => id === event.data?.id))
  }

  return (
    <section className="catalogue-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">{t('NEXUSFLOW / PARTS CATALOGUE')}</p>
          <h1>{t('Parts catalogue')}</h1>
          <p>{t('Browse live inventory, compare vehicle fitment, and check current pricing and availability.')}</p>
        </div>
        <div className="catalogue-heading-actions">
          <Link className="catalogue-card-view-link" to="/catalogue/inventory">{t('Product inventory')} <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-card-view-link" to="/catalogue/pdf">{t('Catalogue manuals')} <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-card-view-link" to="/catalogue/cards">{t('Browse cards')} <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-cart-link" to="/cart" aria-label={`${t('Open cart')}, ${itemCount} ${t('items')}`}>{t('Cart')} <span>{itemCount}</span></Link>
          <span className="catalogue-count"><strong>{catalogueParts.length}</strong> {t('parts available')}</span>
        </div>
      </div>

      {catalogueLoading && <p className="catalogue-feedback" role="status">{t('Loading current inventory…')}</p>}
      {catalogueError && <p className="catalogue-feedback error" role="alert">{catalogueError}</p>}
      {featuredPart ? <section className="catalogue-showcase" aria-label={t('Featured parts image slider')}>
        <div className="catalogue-showcase-image">
          <img key={featuredPart.id} src={featuredPart.image} alt={featuredPart.imageAlt} />
          <span className="catalogue-image-count">{String(activeIndex + 1).padStart(2, '0')} / {String(catalogueParts.length).padStart(2, '0')}</span>
          <button className="catalogue-slide-arrow catalogue-slide-previous" type="button" aria-label={t('Previous part')} title={t('Show previous featured part')} onClick={() => showPart(activeIndex - 1)}>‹</button>
          <button className="catalogue-slide-arrow catalogue-slide-next" type="button" aria-label={t('Next part')} title={t('Show next featured part')} onClick={() => showPart(activeIndex + 1)}>›</button>
        </div>
        <div className="catalogue-showcase-details">
          <div className="catalogue-slide-controls" aria-label={t('Choose a featured part')}>
            {catalogueParts.map((part, index) => (
              <button
                key={part.id}
                type="button"
                className={`catalogue-slide-dot${index === activeIndex ? ' active' : ''}`}
                aria-label={`${t('Show')} ${part.name}`}
                title={`${t('Show')} ${part.name}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => showPart(index)}
              />
            ))}
          </div>
          <span className="catalogue-category-tag">{featuredPart.category}</span>
          <h2>{featuredPart.name}</h2>
          <p className="catalogue-part-number">{t('Part no.')} {featuredPart.id}</p>
          <p className="catalogue-fitment"><span>{t('Fits')}</span> {featuredPart.vehicle}</p>
          <div className="catalogue-showcase-footer">
            <div>
              <span className="catalogue-price-label">{t('Retail price')}</span>
              <strong>{catalogueCurrency.format(featuredPart.price)}</strong>
            </div>
            <span className={featuredPart.stock < 10 ? 'catalogue-stock-pill low' : 'catalogue-stock-pill'}>
              {t(featuredPart.stock < 10 ? 'Low stock' : 'In stock')} · {featuredPart.stock}
            </span>
          </div>
          <span className="catalogue-warranty">{t('Includes')} {featuredPart.warranty} {t('parts warranty')}</span>
        </div>
      </section> : <div className="catalogue-empty-state"><h2>{catalogueLoading ? t('Loading parts catalogue…') : t('No parts available yet')}</h2><p>{catalogueLoading ? t('Current inventory is being loaded.') : t('The catalogue is being prepared. Please check back soon.')}</p></div>}

      <section className="catalogue-table-section" aria-labelledby="catalogue-grid-title">
        <div className="catalogue-table-heading">
          <div>
            <p className="eyebrow">{t('BROWSE THE RANGE')}</p>
            <h2 id="catalogue-grid-title">{t('All parts')}</h2>
          </div>
          <div className="catalogue-table-filters">
            <label className="catalogue-search">
              <span className="sr-only">{t('Search parts')}</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6" /><path d="m13 13 4 4" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search catalogue')} title={t('Search by part number, part name, category, or vehicle fitment')} />
            </label>
            <label className="catalogue-category-filter">
              <span className="sr-only">{t('Filter by category')}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} title={t('Filter the catalogue by part category')}>
                {catalogueCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="catalogue-grid ag-theme-quartz">
          <AgGridReact<CataloguePart>
            rowData={filteredParts}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            theme={themeQuartz}
            tooltipShowDelay={400}
            quickFilterText={search}
            pagination
            paginationPageSize={8}
            paginationPageSizeSelector={[8, 16, 32]}
            localeText={language === 'hi' ? { noRowsToShow: t('No matching parts found.') } : undefined}
            getRowId={({ data }) => data.id}
            onRowClicked={selectGridPart}
            rowHeight={56}
            headerHeight={48}
            overlayNoRowsTemplate={t('No matching parts found.')}
          />
        </div>
        <p className="catalogue-grid-hint">{t('Select a row to preview that part in the image slider. Search, sort, or filter by part description, stock, price, and other columns.')}</p>
      </section>
    </section>
  )
}

export default CataloguePage
