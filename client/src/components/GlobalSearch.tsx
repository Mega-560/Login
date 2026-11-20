import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useLanguage } from '../LanguageContext'
import { highlightSearchMatch } from '../../../shared/highlightSearchMatch'
import { createVoiceRecognition, type VoiceRecognition } from '../../../shared/voiceRecognition'

interface SearchResult {
  label: string
  description: string
  path: string
  searchTerm?: string
  keywords: string
}

const pageResults = [
  { label: 'Home', description: 'Client home page', path: '/', keywords: 'home overview workspace' },
  { label: 'About us', description: 'About NexusFlow', path: '/about', keywords: 'about company' },
  { label: 'Contact us', description: 'Contact information', path: '/contact', keywords: 'contact support email' },
  { label: 'Parts catalogue', description: 'Browse parts and pricing', path: '/catalogue/cards', keywords: 'parts products catalogue' },
  { label: 'Product inventory', description: 'Check stock and availability', path: '/catalogue/inventory', keywords: 'inventory stock availability' },
  { label: 'Catalogue manuals', description: 'Product manuals and PDFs', path: '/catalogue/pdf', keywords: 'manuals documents pdf' },
  { label: 'My orders', description: 'Order history and tracking', path: '/orders', keywords: 'orders history tracking' },
  { label: 'Cart', description: 'Review selected parts', path: '/cart', keywords: 'cart basket shopping' },
  { label: 'Checkout', description: 'Place your parts order', path: '/checkout', keywords: 'checkout order purchase' },
  { label: 'Theme', description: 'Customize portal appearance', path: '/theme', keywords: 'theme colors appearance' },
]

function GlobalSearch() {
  const navigate = useNavigate()
  const { catalogueParts } = useCart()
  const { language, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const recognitionRef = useRef<VoiceRecognition | null>(null)

  const results = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase()
    if (!searchTerm) return []

    const matchingPages: SearchResult[] = pageResults
      .map((result) => ({
        ...result,
        label: t(result.label),
        description: t(result.description),
      }))
      .filter(({ label, description, keywords }) =>
        `${label} ${description} ${keywords}`.toLocaleLowerCase().includes(searchTerm))

    const matchingParts: SearchResult[] = catalogueParts
      .filter((part) => [part.name, part.id, part.category, part.vehicle, part.description, part.warranty, part.imageAlt]
        .some((value) => value.toLocaleLowerCase().includes(searchTerm)))
      .map((part) => ({
        label: part.name,
        description: `${part.id} · ${part.category} · ${part.vehicle}`,
        path: '/catalogue/cards',
        searchTerm: part.name,
        keywords: part.description,
      }))

    return [...matchingPages, ...matchingParts].slice(0, 7)
  }, [catalogueParts, query, t])

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.onerror = null
      recognitionRef.current.onresult = null
      recognitionRef.current.abort()
    }
  }, [])

  function selectResult(result: SearchResult) {
    setIsOpen(false)
    setQuery('')
    navigate(result.path, result.searchTerm ? { state: { globalSearch: result.searchTerm } } : undefined)
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
      <label className="visually-hidden" htmlFor="client-global-search">{t('Search the website')}</label>
      <input
        id="client-global-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          setSearchMessage('')
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
          {query.trim() && (results.length ? (
            <ul aria-label={t('Search results')}>
              {results.map((result) => (
                <li key={`${result.path}-${result.label}`}>
                  <button type="button" onClick={() => selectResult(result)}>
                    <strong>{highlightSearchMatch(result.label, query).map(({ text, isMatch }, index) =>
                      isMatch ? <mark key={index}>{text}</mark> : text)}</strong>
                    <span>{highlightSearchMatch(result.description, query).map(({ text, isMatch }, index) =>
                      isMatch ? <mark key={index}>{text}</mark> : text)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isListening && <p className="global-search-message" role="status">{t('No results found.')}</p>)}
        </div>
      )}
    </form>
  )
}

export default GlobalSearch
