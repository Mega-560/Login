import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readSavedLanguage, saveLanguage, translate, type Language } from '../../shared/language'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (text: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>(readSavedLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage: Language) {
    saveLanguage(nextLanguage)
    setCurrentLanguage(nextLanguage)
  }

  const value = useMemo(
    () => ({ language, setLanguage, t: (text: string) => translate(text, language) }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider.')
  return context
}
