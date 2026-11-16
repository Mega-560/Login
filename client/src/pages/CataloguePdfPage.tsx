import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogueApi, type CatalogueManual } from '../data/catalogueApi'
import './catalogueOperations.css'

function CataloguePdfPage() {
  const [manuals, setManuals] = useState<CatalogueManual[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    catalogueApi.getManuals()
      .then((loadedManuals) => {
        if (!active) return
        setManuals(loadedManuals)
        setSelectedId(loadedManuals[0]?.id ?? '')
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load catalogue manuals.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedManual = manuals.find((manual) => manual.id === selectedId)
  const filteredManuals = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return manuals
    return manuals.filter((manual) => `${manual.name} ${manual.categoryName}`.toLocaleLowerCase().includes(query))
  }, [manuals, search])

  useEffect(() => {
    if (!selectedId) {
      setFileUrl('')
      setIsLoadingFile(false)
      return
    }
    let active = true
    let objectUrl = ''
    setError('')
    setFileUrl('')
    setIsLoadingFile(true)
    catalogueApi.getManualFile(selectedId)
      .then((data) => {
        if (!active) return
        objectUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        setFileUrl(objectUrl)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not open this catalogue manual.')
      })
      .finally(() => {
        if (active) setIsLoadingFile(false)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedId])

  return (
    <section className="catalogue-page catalogue-manuals-page">
      <header className="catalogue-page-heading">
        <div>
          <p className="eyebrow">PRODUCT LIBRARY / DOCUMENTS</p>
          <h1>Catalogue manuals</h1>
          <p>Browse product manuals and catalogue PDFs shared by the parts team.</p>
        </div>
        <Link className="catalogue-card-view-link" to="/catalogue/cards">Browse parts <span aria-hidden="true">→</span></Link>
      </header>

      {error && <p className="catalogue-feedback error" role="alert">{error}</p>}

      <div className="client-manuals-layout">
        <aside className="client-manuals-list" aria-label="Available catalogue manuals">
          <label className="client-manuals-search">
            <span>Search manuals</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or category" />
          </label>
          {isLoading ? <p className="catalogue-empty" role="status">Loading manuals…</p>
            : filteredManuals.length === 0
              ? <p className="catalogue-empty">{manuals.length ? 'No manuals match your search.' : 'No manuals have been published yet.'}</p>
              : <ul>
                {filteredManuals.map((manual) => (
                  <li key={manual.id}>
                    <button
                      type="button"
                      className={selectedId === manual.id ? 'is-selected' : ''}
                      aria-current={selectedId === manual.id ? 'true' : undefined}
                      onClick={() => setSelectedId(manual.id)}
                    >
                      <span className="client-manual-file-icon" aria-hidden="true">PDF</span>
                      <span><strong>{manual.name}</strong><small>{manual.categoryName} · {(manual.size / (1024 * 1024)).toFixed(1)} MB</small></span>
                    </button>
                  </li>
                ))}
              </ul>}
        </aside>
        <section className="client-manual-viewer" aria-label="Catalogue manual viewer">
          {selectedManual ? (
            <>
              <header>
                <div><p className="eyebrow">{selectedManual.categoryName}</p><h2>{selectedManual.name}</h2></div>
                {fileUrl && <a className="catalogue-secondary-button" href={fileUrl} download={selectedManual.name}>Download PDF</a>}
              </header>
              {isLoadingFile ? <p className="catalogue-empty" role="status">Opening manual…</p>
                : fileUrl && <iframe title={selectedManual.name} src={fileUrl} />}
            </>
          ) : !isLoading && <div className="catalogue-empty-state"><h2>Manuals will appear here</h2><p>When the parts team publishes a PDF, you can open it in this viewer.</p></div>}
        </section>
      </div>
    </section>
  )
}

export default CataloguePdfPage
