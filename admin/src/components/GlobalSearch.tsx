import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../adminApi'
import { useLanguage } from '../LanguageContext'
import { highlightSearchMatch } from '../../../shared/highlightSearchMatch'
import { createVoiceRecognition, type VoiceRecognition } from '../../../shared/voiceRecognition'

interface SearchResult {
  id: string
  label: string
  description: string
  path: string
  keywords: string
}

const adminSections = [
  { id: '/admin', label: 'Dashboard', description: 'Admin dashboard', path: '/admin', keywords: 'analytics overview sales' },
  { id: '/admin/users', label: 'User admin', description: 'Manage users', path: '/admin/users', keywords: 'accounts users customers' },
  { id: '/admin/roles', label: 'Roles & permissions', description: 'Manage roles and permissions', path: '/admin/roles', keywords: 'access security permissions' },
  { id: '/admin/calendar', label: 'Calendar', description: 'View events and appointments', path: '/admin/calendar', keywords: 'events schedule appointments' },
  { id: '/admin/parts', label: 'Parts inventory', description: 'Manage parts and stock', path: '/admin/parts', keywords: 'products parts inventory stock' },
  { id: '/admin/orders', label: 'Customer orders', description: 'Review customer orders', path: '/admin/orders', keywords: 'orders payments shipping' },
  { id: '/admin/partners', label: 'Dealers & retailers', description: 'Manage business partners', path: '/admin/partners', keywords: 'dealers retailers partners' },
  { id: '/admin/catalogue', label: 'Catalogue', description: 'Manage catalogue manuals', path: '/admin/catalogue', keywords: 'catalogue pdf manuals documents' },
  { id: '/admin/state-map', label: 'India state map', description: 'Explore dealer coverage by state', path: '/admin/state-map', keywords: 'map states coverage' },
  { id: '/admin/theme', label: 'Theme', description: 'Customize portal appearance', path: '/admin/theme', keywords: 'theme colors appearance' },
]

function GlobalSearch() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [recordResults, setRecordResults] = useState<SearchResult[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [recordSearchError, setRecordSearchError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const recognitionRef = useRef<VoiceRecognition | null>(null)
  const recordIndexPromiseRef = useRef<Promise<void> | null>(null)
  const isMountedRef = useRef(false)

  const results = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase()
    if (!searchTerm) return []

    const matchingSections: SearchResult[] = adminSections
      .map((section) => ({
        ...section,
        label: t(section.label),
        description: t(section.description),
      }))
      .filter(({ label, description, keywords }) =>
        `${label} ${description} ${keywords}`.toLocaleLowerCase().includes(searchTerm))
    const matchingRecords = recordResults.filter(({ label, description, keywords }) =>
      `${label} ${description} ${keywords}`.toLocaleLowerCase().includes(searchTerm))

    return [...matchingRecords, ...matchingSections].slice(0, 7)
  }, [query, recordResults, t])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onresult = null
        recognitionRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!query.trim() || recordIndexPromiseRef.current) return

    setIsLoadingRecords(true)
    const indexPromise = Promise.all([
      adminApi.getUsers(),
      adminApi.getCatalogueParts(),
      adminApi.getOrders(),
      adminApi.getBusinessPartners(),
      adminApi.getManualCategories(),
      adminApi.getCatalogueManuals(),
    ])
      .then(([users, parts, orders, partners, categories, manuals]) => {
        if (!isMountedRef.current) return
        setRecordResults([
          ...users.map((user) => ({
            id: `user-${user.id}`,
            label: user.name,
            description: `${user.email} · ${user.role}`,
            path: '/admin/users',
            keywords: `${user.id} ${user.role} user account`,
          })),
          ...parts.map((part) => ({
            id: `part-${part.id}`,
            label: part.name,
            description: `${part.id} · ${part.category} · ${part.vehicle}`,
            path: '/admin/parts',
            keywords: `${part.description} ${part.warranty} ${part.imageAlt} ${part.price} ${part.stock} part inventory`,
          })),
          ...orders.map((order) => ({
            id: `order-${order.id}`,
            label: `Order ${order.id}`,
            description: `${order.customerName} · ${order.status} · ${order.paymentStatus}`,
            path: '/admin/orders',
            keywords: `${order.customerEmail} ${order.shippingAddress} ${order.shippingStatus} ${order.shippingCarrier ?? ''} ${order.trackingNumber ?? ''} ${order.partnerName ?? ''} ${order.items.map((item) => `${item.partId} ${item.partName}`).join(' ')} customer order`,
          })),
          ...partners.map((partner) => ({
            id: `partner-${partner.id}`,
            label: partner.name,
            description: `${partner.type} · ${partner.contactName} · ${partner.email}`,
            path: '/admin/partners',
            keywords: `${partner.id} ${partner.phone} ${partner.address} ${partner.notes} dealer retailer partner`,
          })),
          ...categories.map((category) => ({
            id: `category-${category.id}`,
            label: category.name,
            description: 'Catalogue category',
            path: '/admin/catalogue',
            keywords: `${category.id} manual category`,
          })),
          ...manuals.map((manual) => ({
            id: `manual-${manual.id}`,
            label: manual.name,
            description: `${manual.categoryName} · PDF manual`,
            path: '/admin/catalogue',
            keywords: `${manual.id} ${manual.categoryId} ${manual.categoryName} catalogue document`,
          })),
        ])
        setRecordSearchError('')
      })
      .catch((cause: unknown) => {
        if (!isMountedRef.current) return
        setRecordSearchError(cause instanceof Error ? cause.message : t('Could not search admin records.'))
        recordIndexPromiseRef.current = null
      })
      .finally(() => {
        if (isMountedRef.current) setIsLoadingRecords(false)
      })
    recordIndexPromiseRef.current = indexPromise
  }, [query, t])

  function selectResult(result: SearchResult) {
    setIsOpen(false)
    setQuery('')
    navigate(result.path)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (results[0]) selectResult(results[0])
    else setIsOpen(true)
  }

  function startVoiceSearch() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    setSearchMessage('')
    const recognition = createVoiceRecognition(language === 'hi' ? 'hi-IN' : 'en-IN', {
      onTranscript: (transcript) => {
        setQuery(transcript)
        setIsOpen(true)
      },
      onError: (error) => {
        setIsListening(false)
        recognitionRef.current = null
        setSearchMessage(error === 'not-allowed' || error === 'service-not-allowed'
          ? t('Microphone access was denied. Allow microphone access and try again.')
          : error === 'no-speech'
            ? t('No speech was detected. Try again.')
            : t('Voice search failed. Try again.'))
      },
      onEnd: () => {
        setIsListening(false)
        recognitionRef.current = null
      },
    })

    if (!recognition) {
      setSearchMessage(t('Voice search is not supported in this browser.'))
      return
    }

    recognitionRef.current = recognition
    setIsOpen(true)
    setIsListening(true)
    setSearchMessage(t('Listening…'))
    try {
      recognition.start()
    } catch (error) {
      recognitionRef.current = null
      setIsListening(false)
      setSearchMessage(error instanceof Error ? error.message : t('Could not start voice search.'))
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <form className="global-search" role="search" onSubmit={submitSearch}>
      <label className="visually-hidden" htmlFor="admin-global-search">{t('Search the website')}</label>
      <input
        id="admin-global-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          setSearchMessage('')
          setRecordSearchError('')
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t(isListening ? 'Listening…' : 'Search the website')}
        autoComplete="off"
      />
      <button className="global-search-submit" type="submit" aria-label={t('Search')}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="8.7" cy="8.7" r="5.6" />
          <path d="m13 13 4 4" />
        </svg>
      </button>
      <button
        className={`global-search-microphone${isListening ? ' is-listening' : ''}`}
        type="button"
        onClick={startVoiceSearch}
        aria-label={t(isListening ? 'Stop voice search' : 'Start voice search')}
        aria-pressed={isListening}
        title={t(isListening ? 'Stop voice search' : 'Start voice search')}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="7" y="2.5" width="6" height="10" rx="3" />
          <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7 17.5h6" />
        </svg>
      </button>
      {(isOpen && (query.trim() || searchMessage || isListening)) && (
        <div className="global-search-popover">
          {searchMessage && <p className="global-search-message" role="status">{searchMessage}</p>}
          {recordSearchError && <p className="global-search-message" role="alert">{recordSearchError}</p>}
          {query.trim() && isLoadingRecords && <p className="global-search-message" role="status">{t('Searching records…')}</p>}
          {query.trim() && (results.length ? (
            <ul aria-label={t('Search results')}>
              {results.map((result) => (
                <li key={result.id}>
                  <button type="button" onClick={() => selectResult(result)}>
                    <strong>{highlightSearchMatch(result.label, query).map(({ text, isMatch }, index) =>
                      isMatch ? <mark key={index}>{text}</mark> : text)}</strong>
                    <span>{highlightSearchMatch(result.description, query).map(({ text, isMatch }, index) =>
                      isMatch ? <mark key={index}>{text}</mark> : text)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isListening && !isLoadingRecords && !recordSearchError && <p className="global-search-message" role="status">{t('No results found.')}</p>)}
        </div>
      )}
    </form>
  )
}

export default GlobalSearch
