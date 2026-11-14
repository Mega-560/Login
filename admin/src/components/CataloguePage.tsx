import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const databaseName = 'nexusflow-catalogue'
const objectStoreName = 'catalogue-items'
const rootId = 'catalog-root'
const defaultCategoryId = 'catalog-manuals'

interface CategoryRecord {
  id: string
  kind: 'category'
  parentId: string | null
  name: string
}

interface PdfRecord {
  id: string
  kind: 'pdf'
  parentId: string
  name: string
  file: Blob
}

type CatalogueRecord = CategoryRecord | PdfRecord

interface SearchHit {
  page: number
  excerpt: string
}

function openCatalogueDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(objectStoreName, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open catalogue storage.'))
  })
}

function readCatalogueRecords(database: IDBDatabase): Promise<CatalogueRecord[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, 'readonly')
    const request = transaction.objectStore(objectStoreName).getAll()
    request.onsuccess = () => resolve(request.result as CatalogueRecord[])
    request.onerror = () => reject(request.error ?? new Error('Could not read the catalogue.'))
  })
}

function saveCatalogueRecord(database: IDBDatabase, record: CatalogueRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, 'readwrite')
    transaction.objectStore(objectStoreName).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this catalogue item.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving this catalogue item was cancelled.'))
  })
}

function createId() {
  return crypto.randomUUID()
}

function CataloguePage() {
  const [records, setRecords] = useState<CatalogueRecord[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategoryId)
  const [selectedPdfId, setSelectedPdfId] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set([rootId, defaultCategoryId]),
  )
  const [categoryName, setCategoryName] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchHits, setSearchHits] = useState<SearchHit[]>([])
  const [activeHitIndex, setActiveHitIndex] = useState(-1)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const database = useRef<IDBDatabase | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const searchRequest = useRef(0)
  const selectedPdf = records.find((record): record is PdfRecord =>
    record.kind === 'pdf' && record.id === selectedPdfId)
  const selectedCategory = records.find((record): record is CategoryRecord =>
    record.kind === 'category' && record.id === selectedCategoryId)

  const categoriesByParent = useMemo(() => {
    const grouped = new Map<string, CatalogueRecord[]>()
    records.forEach((record) => {
      if (!record.parentId) return
      const children = grouped.get(record.parentId) ?? []
      children.push(record)
      grouped.set(record.parentId, children)
    })
    grouped.forEach((children) => children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'category' ? -1 : 1
      return a.name.localeCompare(b.name)
    }))
    return grouped
  }, [records])

  useEffect(() => {
    let active = true
    void openCatalogueDatabase()
      .then(async (db) => {
        if (!active) {
          db.close()
          return
        }
        database.current = db
        let savedRecords = await readCatalogueRecords(db)
        if (!savedRecords.some((record) => record.id === rootId)) {
          const starterRecords: CatalogueRecord[] = [
            { id: rootId, kind: 'category', parentId: null, name: 'Catalog' },
            { id: defaultCategoryId, kind: 'category', parentId: rootId, name: 'Catalogue Manuals' },
          ]
          await Promise.all(starterRecords.map((record) => saveCatalogueRecord(db, record)))
          savedRecords = [...savedRecords, ...starterRecords]
        } else if (!savedRecords.some((record) => record.id === defaultCategoryId)) {
          const starterCategory: CategoryRecord = {
            id: defaultCategoryId,
            kind: 'category',
            parentId: rootId,
            name: 'Catalogue Manuals',
          }
          await saveCatalogueRecord(db, starterCategory)
          savedRecords = [...savedRecords, starterCategory]
        }
        if (!active) return
        setRecords(savedRecords)
        setIsLoading(false)
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load catalogue storage.')
          setIsLoading(false)
        }
      })
    return () => {
      active = false
      database.current?.close()
      database.current = null
    }
  }, [])

  useEffect(() => {
    if (!selectedPdf) {
      searchRequest.current += 1
      setIsSearching(false)
      setPdfDocument(null)
      setPageCount(0)
      setPageNumber(1)
      setSearchHits([])
      setActiveHitIndex(-1)
      return
    }
    let active = true
    setError('')
    setNotice('')
    setPdfDocument(null)
    setPageCount(0)
    setPageNumber(1)
    setSearchHits([])
    setActiveHitIndex(-1)
    setSearchText('')
    setIsSearching(false)
    let loadingTask: ReturnType<typeof getDocument> | null = null
    void selectedPdf.file.arrayBuffer()
      .then((data) => {
        if (!active) return null
        loadingTask = getDocument({ data })
        return loadingTask.promise
      })
      .then((document) => {
        if (!document) return
        if (!active) return
        setPdfDocument(document)
        setPageCount(document.numPages)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not open this PDF.')
      })
    return () => {
      active = false
      searchRequest.current += 1
      if (loadingTask) {
        void loadingTask.destroy().catch((cause: unknown) => console.error('Could not release the PDF loading task.', cause))
      }
    }
  }, [selectedPdf])

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !viewerRef.current) return
    let active = true
    let renderTask: RenderTask | null = null
    void pdfDocument.getPage(pageNumber)
      .then((page: PDFPageProxy) => {
        if (!active || !canvasRef.current || !viewerRef.current) return
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not prepare the PDF page for display.')
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = Math.min(1.7, Math.max(0.5, (viewerRef.current.clientWidth - 48) / baseViewport.width))
        const viewport = page.getViewport({ scale })
        const pixelRatio = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * pixelRatio)
        canvas.height = Math.floor(viewport.height * pixelRatio)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        })
        return renderTask.promise
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not render this PDF page.')
      })
    return () => {
      active = false
      renderTask?.cancel()
    }
  }, [pdfDocument, pageNumber])

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database.current || !selectedCategory) return
    const name = categoryName.trim()
    if (!name) return
    setError('')
    setNotice('')
    const category: CategoryRecord = {
      id: createId(),
      kind: 'category',
      parentId: selectedCategory.id,
      name,
    }
    try {
      await saveCatalogueRecord(database.current, category)
      setRecords((current) => [...current, category])
      setExpandedCategories((current) => new Set(current).add(selectedCategory.id))
      setCategoryName('')
      setNotice(`Category "${name}" added.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this category.')
    }
  }

  async function addPdf(file: File | undefined) {
    if (!file || !database.current || !selectedCategory) return
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size === 0) {
      setError('Choose a non-empty PDF file.')
      return
    }
    setError('')
    setNotice('')
    const pdf: PdfRecord = {
      id: createId(),
      kind: 'pdf',
      parentId: selectedCategory.id,
      name: file.name,
      file,
    }
    try {
      await saveCatalogueRecord(database.current, pdf)
      setRecords((current) => [...current, pdf])
      setSelectedPdfId(pdf.id)
      setExpandedCategories((current) => new Set(current).add(selectedCategory.id))
      setNotice(`"${file.name}" added to ${selectedCategory.name}.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add this PDF.')
    }
  }

  async function searchPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pdfDocument) return
    const query = searchText.trim().toLocaleLowerCase()
    if (!query) {
      setSearchHits([])
      setActiveHitIndex(-1)
      return
    }
    setIsSearching(true)
    setError('')
    const requestId = ++searchRequest.current
    try {
      const hits: SearchHit[] = []
      for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
        const page = await pdfDocument.getPage(pageIndex)
        const content = await page.getTextContent()
        if (requestId !== searchRequest.current) return
        const text = content.items
          .filter((item): item is typeof item & { str: string } => 'str' in item && typeof item.str === 'string')
          .map((item) => item.str)
          .join(' ')
        const lowerText = text.toLocaleLowerCase()
        let matchIndex = lowerText.indexOf(query)
        while (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 35)
          const end = Math.min(text.length, matchIndex + query.length + 35)
          hits.push({ page: pageIndex, excerpt: text.slice(start, end).replace(/\s+/g, ' ').trim() })
          matchIndex = lowerText.indexOf(query, matchIndex + query.length)
        }
      }
      setSearchHits(hits)
      setActiveHitIndex(hits.length ? 0 : -1)
      if (hits.length) {
        setPageNumber(hits[0].page)
        setNotice(`${hits.length} match${hits.length === 1 ? '' : 'es'} found.`)
      } else {
        setNotice('No text matches found. Scanned PDFs may need OCR before they can be searched.')
      }
    } catch (cause) {
      if (requestId === searchRequest.current) {
        setError(cause instanceof Error ? cause.message : 'Could not search this PDF.')
      }
    } finally {
      if (requestId === searchRequest.current) setIsSearching(false)
    }
  }

  function moveSearchHit(offset: number) {
    if (!searchHits.length) return
    const nextIndex = (activeHitIndex + offset + searchHits.length) % searchHits.length
    setActiveHitIndex(nextIndex)
    setPageNumber(searchHits[nextIndex].page)
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((current) => {
      const next = new Set(current)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  function renderTree(category: CategoryRecord, depth = 0) {
    const expanded = expandedCategories.has(category.id)
    const children = categoriesByParent.get(category.id) ?? []
    return (
      <div className="catalogue-tree-branch" key={category.id}>
        <div className={`catalogue-tree-row${selectedCategoryId === category.id ? ' selected' : ''}`} style={{ paddingLeft: 10 + depth * 18 }}>
          <button
            type="button"
            className="catalogue-tree-toggle"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
            aria-expanded={expanded}
            onClick={() => toggleCategory(category.id)}
          >
            {children.length ? (expanded ? '▾' : '▸') : '·'}
          </button>
          <button
            type="button"
            className="catalogue-tree-category"
            onClick={() => {
              setSelectedCategoryId(category.id)
              setSelectedPdfId('')
            }}
          >
            <span className="catalogue-folder-icon" aria-hidden="true">▰</span>
            <span>{category.name}</span>
          </button>
        </div>
        {expanded && children.map((child) => child.kind === 'category'
          ? renderTree(child, depth + 1)
          : (
            <div className={`catalogue-tree-row catalogue-tree-pdf${selectedPdfId === child.id ? ' selected' : ''}`} key={child.id} style={{ paddingLeft: 31 + depth * 18 }}>
              <span className="catalogue-tree-file-icon" aria-hidden="true">PDF</span>
              <button
                type="button"
                className="catalogue-tree-category"
                onClick={() => {
                  setSelectedCategoryId(category.id)
                  setSelectedPdfId(child.id)
                }}
                title={`Open ${child.name}`}
              >
                <span>{child.name}</span>
              </button>
            </div>
          ))}
      </div>
    )
  }

  return (
    <section className="catalogue-page">
      <header className="admin-page-heading catalogue-page-heading">
        <div>
          <p className="eyebrow">PRODUCT LIBRARY / DOCUMENTS</p>
          <h1>Catalogue manuals</h1>
          <p className="admin-page-subtitle">Organize catalogue PDFs into folders and search their contents.</p>
        </div>
      </header>

      <div className="catalogue-workspace">
        <aside className="catalogue-library-panel" aria-label="Catalogue folders and manuals">
          <div className="catalogue-panel-heading">
            <div><h2>Catalogue</h2><p>Folders and PDF manuals</p></div>
          </div>
          <div className="catalogue-tree" role="region" aria-label="Catalogue library">
            {isLoading
              ? <p className="catalogue-empty">Loading catalogue…</p>
              : records
                .filter((record): record is CategoryRecord => record.kind === 'category' && record.parentId === null)
                .map((root) => renderTree(root))}
          </div>
          <div className="catalogue-library-actions">
            <form className="catalogue-add-category" onSubmit={(event) => void addCategory(event)}>
              <label htmlFor="catalogue-category-name">New subcategory in {selectedCategory?.name ?? 'Catalog'}</label>
              <div>
                <input
                  id="catalogue-category-name"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Category name"
                  maxLength={80}
                  disabled={isLoading}
                />
                <button type="submit" className="catalogue-secondary-button" disabled={!categoryName.trim() || isLoading}>Add</button>
              </div>
            </form>
            <label className="catalogue-upload-button">
              <span aria-hidden="true">＋</span> Add PDF to {selectedCategory?.name ?? 'category'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={isLoading}
                onChange={(event) => {
                  void addPdf(event.currentTarget.files?.[0])
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        </aside>

        <section className="catalogue-viewer-panel" aria-label="PDF viewer">
          {selectedPdf ? (
            <>
              <div className="catalogue-viewer-heading">
                <div className="catalogue-document-title">
                  <span className="catalogue-file-badge">PDF</span>
                  <div><h2 title={selectedPdf.name}>{selectedPdf.name}</h2><p>{selectedCategory?.name}</p></div>
                </div>
                <form className="catalogue-search" onSubmit={(event) => void searchPdf(event)}>
                  <label htmlFor="catalogue-pdf-search">Search PDF text</label>
                  <div>
                    <input
                      id="catalogue-pdf-search"
                      type="search"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Find text in this manual"
                    />
                    <button type="submit" disabled={!pdfDocument || isSearching}>{isSearching ? 'Searching…' : 'Search'}</button>
                  </div>
                </form>
              </div>
              <div className="catalogue-viewer-toolbar">
                <div className="catalogue-page-controls">
                  <button type="button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={!pdfDocument || pageNumber <= 1} aria-label="Previous PDF page">Previous page</button>
                  <span>Page <strong>{pageNumber}</strong> of {pageCount || '—'}</span>
                  <button type="button" onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))} disabled={!pdfDocument || pageNumber >= pageCount} aria-label="Next PDF page">Next page</button>
                </div>
                {searchHits.length > 0 && (
                  <div className="catalogue-search-controls" aria-live="polite">
                    <span>{activeHitIndex + 1} of {searchHits.length} matches</span>
                    <button type="button" onClick={() => moveSearchHit(-1)} aria-label="Previous search match">↑</button>
                    <button type="button" onClick={() => moveSearchHit(1)} aria-label="Next search match">↓</button>
                  </div>
                )}
              </div>
              {error && <p className="catalogue-feedback error" role="alert">{error}</p>}
              {notice && <p className="catalogue-feedback" role="status">{notice}</p>}
              {searchHits.length > 0 && (
                <p className="catalogue-search-excerpt" aria-live="polite">
                  <strong>Match on page {searchHits[activeHitIndex]?.page}:</strong> {searchHits[activeHitIndex]?.excerpt}
                </p>
              )}
              <div className="catalogue-pdf-viewport" ref={viewerRef}>
                {pdfDocument
                  ? <canvas ref={canvasRef} className="catalogue-pdf-canvas" aria-label={`PDF page ${pageNumber}`} />
                  : !error && <p className="catalogue-empty" role="status">Opening PDF…</p>}
              </div>
            </>
          ) : (
            <div className="catalogue-viewer-empty">
              <span className="catalogue-empty-icon" aria-hidden="true">▤</span>
              <h2>Select a PDF manual</h2>
              <p>Choose a PDF in the catalogue tree, or add a manual to the selected category.</p>
            </div>
          )}
        </section>
      </div>
      {error && !selectedPdf && <p className="catalogue-feedback error" role="alert">{error}</p>}
      {notice && !selectedPdf && <p className="catalogue-feedback" role="status">{notice}</p>}
    </section>
  )
}

export default CataloguePage
