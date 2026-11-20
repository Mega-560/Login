import AppRoutes from './routes/AppRoutes'
import { LanguageProvider } from './LanguageContext'
import './theme-colors.scss'

function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  )
}

export default App
