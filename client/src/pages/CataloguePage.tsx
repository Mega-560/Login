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

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  TooltipModule,
])

const columnDefs: ColDef<CataloguePart>[] = [
  {
    colId: 'image',
    headerName: 'IMAGE',
    headerTooltip: 'Catalogue part image',
    sortable: false,
    filter: false,
    minWidth: 95,
    maxWidth: 105,
    cellRenderer: ({ data }: { data?: CataloguePart }) => data
      ? <img className="catalogue-grid-image" src={data.image} alt={data.imageAlt} />
      : null,
  },
  { field: 'id', headerName: 'PART NUMBER', headerTooltip: 'Unique catalogue part number', tooltipField: 'id', minWidth: 140 },
  { field: 'name', headerName: 'PART DETAILS', headerTooltip: 'Name of the replacement part', tooltipField: 'name', minWidth: 210, flex: 1 },
  { field: 'description', headerName: 'DESCRIPTION', headerTooltip: 'Product description and key features', tooltipField: 'description', minWidth: 250, flex: 1 },
  { field: 'category', headerName: 'CATEGORY', headerTooltip: 'Part system or product category', tooltipField: 'category', minWidth: 135 },
  { field: 'vehicle', headerName: 'VEHICLE FITMENT', headerTooltip: 'Vehicle models this part fits', tooltipField: 'vehicle', minWidth: 195 },
  {
    field: 'price',
    headerName: 'PRICE',
    headerTooltip: 'Retail price in US dollars',
    tooltipValueGetter: ({ value }) => catalogueCurrency.format(Number(value)),
    minWidth: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: ({ value }) => catalogueCurrency.format(value as number),
  },
  {
    field: 'stock',
    headerName: 'IN STOCK',
    headerTooltip: 'Number of units currently available',
    tooltipValueGetter: ({ value }) => `${value} units available`,
    minWidth: 115,
    filter: 'agNumberColumnFilter',
    cellClass: ({ value }) => Number(value) < 10 ? 'catalogue-stock-low' : 'catalogue-stock-ready',
  },
  { field: 'warranty', headerName: 'WARRANTY', headerTooltip: 'Manufacturer parts warranty', tooltipField: 'warranty', minWidth: 125 },
]

function CataloguePage() {
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
          <p className="eyebrow">NEXUSFLOW / PARTS CATALOGUE</p>
          <h1>Parts catalogue</h1>
          <p>Browse live inventory, compare vehicle fitment, and check current pricing and availability.</p>
        </div>
        <div className="catalogue-heading-actions">
          <Link className="catalogue-card-view-link" to="/catalogue/inventory">Product inventory <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-card-view-link" to="/catalogue/pdf">Catalogue manuals <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-card-view-link" to="/catalogue/cards">Browse cards <span aria-hidden="true">→</span></Link>
          <Link className="catalogue-cart-link" to="/cart" aria-label={`Open cart, ${itemCount} items`}>Cart <span>{itemCount}</span></Link>
          <span className="catalogue-count"><strong>{catalogueParts.length}</strong> parts available</span>
        </div>
      </div>

      {catalogueLoading && <p className="catalogue-feedback" role="status">Loading current inventory…</p>}
      {catalogueError && <p className="catalogue-feedback error" role="alert">{catalogueError}</p>}
      {featuredPart ? <section className="catalogue-showcase" aria-label="Featured parts image slider">
        <div className="catalogue-showcase-image">
          <img key={featuredPart.id} src={featuredPart.image} alt={featuredPart.imageAlt} />
          <span className="catalogue-image-count">{String(activeIndex + 1).padStart(2, '0')} / {String(catalogueParts.length).padStart(2, '0')}</span>
          <button className="catalogue-slide-arrow catalogue-slide-previous" type="button" aria-label="Previous part" title="Show previous featured part" onClick={() => showPart(activeIndex - 1)}>‹</button>
          <button className="catalogue-slide-arrow catalogue-slide-next" type="button" aria-label="Next part" title="Show next featured part" onClick={() => showPart(activeIndex + 1)}>›</button>
        </div>
        <div className="catalogue-showcase-details">
          <div className="catalogue-slide-controls" aria-label="Choose a featured part">
            {catalogueParts.map((part, index) => (
              <button
                key={part.id}
                type="button"
                className={`catalogue-slide-dot${index === activeIndex ? ' active' : ''}`}
                aria-label={`Show ${part.name}`}
                title={`Show ${part.name}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => showPart(index)}
              />
            ))}
          </div>
          <span className="catalogue-category-tag">{featuredPart.category}</span>
          <h2>{featuredPart.name}</h2>
          <p className="catalogue-part-number">Part no. {featuredPart.id}</p>
          <p className="catalogue-fitment"><span>Fits</span> {featuredPart.vehicle}</p>
          <div className="catalogue-showcase-footer">
            <div>
              <span className="catalogue-price-label">Retail price</span>
              <strong>{catalogueCurrency.format(featuredPart.price)}</strong>
            </div>
            <span className={featuredPart.stock < 10 ? 'catalogue-stock-pill low' : 'catalogue-stock-pill'}>
              {featuredPart.stock < 10 ? 'Low stock' : 'In stock'} · {featuredPart.stock}
            </span>
          </div>
          <span className="catalogue-warranty">Includes {featuredPart.warranty} parts warranty</span>
        </div>
      </section> : <div className="catalogue-empty-state"><h2>{catalogueLoading ? 'Loading parts catalogue…' : 'No parts available yet'}</h2><p>{catalogueLoading ? 'Current inventory is being loaded.' : 'The catalogue is being prepared. Please check back soon.'}</p></div>}

      <section className="catalogue-table-section" aria-labelledby="catalogue-grid-title">
        <div className="catalogue-table-heading">
          <div>
            <p className="eyebrow">BROWSE THE RANGE</p>
            <h2 id="catalogue-grid-title">All parts</h2>
          </div>
          <div className="catalogue-table-filters">
            <label className="catalogue-search">
              <span className="sr-only">Search parts</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6" /><path d="m13 13 4 4" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" title="Search by part number, part name, category, or vehicle fitment" />
            </label>
            <label className="catalogue-category-filter">
              <span className="sr-only">Filter by category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} title="Filter the catalogue by part category">
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
            getRowId={({ data }) => data.id}
            onRowClicked={selectGridPart}
            rowHeight={56}
            headerHeight={48}
            overlayNoRowsTemplate="No matching parts found."
          />
        </div>
        <p className="catalogue-grid-hint">Select a row to preview that part in the image slider. Search, sort, or filter by part description, stock, price, and other columns.</p>
      </section>
    </section>
  )
}

export default CataloguePage
