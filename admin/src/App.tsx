import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import AdminPage from './components/AdminPage'
import RolePage from './components/RolePage'
import ThemePage from './components/ThemePage'
import CalendarPage from './components/CalendarPage'
import NotFoundPage from './pages/NotFoundPage'
import RequireAdmin from './components/RequireAdmin'
import AuthLayout from './modules/auth/AuthLayout'
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage'
import LoginPage from './modules/auth/pages/LoginPage'
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage'
import VerifyOtpPage from './modules/auth/pages/VerifyOtpPage'
import RequireAuth from './modules/auth/RequireAuth'
import { LanguageProvider, useLanguage } from './LanguageContext'
import './App.css'
import './theme-colors.scss'

const DashboardPage = lazy(() => import('./components/DashboardPage'))
const StateMapPage = lazy(() => import('./components/StateMapPage'))
const CataloguePage = lazy(() => import('./components/CataloguePage'))
const CataloguePartsPage = lazy(() => import('./components/CataloguePartsPage'))
const CatalogueOrdersPage = lazy(() => import('./components/CatalogueOrdersPage'))
const BusinessPartnersPage = lazy(() => import('./components/BusinessPartnersPage'))

function LoadingMessage({ message }: { message: string }) {
  const { t } = useLanguage()
  return <div className="admin-dashboard-loading" role="status">{t(message)}</div>
}

function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={(
              <Suspense fallback={<LoadingMessage message="Loading dashboard charts…" />}>
                <DashboardPage />
              </Suspense>
            )} />
            <Route path="users" element={<AdminPage />} />
            <Route path="roles" element={<RolePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route
              path="parts"
              element={(
                <Suspense fallback={<LoadingMessage message="Loading parts inventory…" />}>
                  <CataloguePartsPage />
                </Suspense>
              )}
            />
            <Route
              path="orders"
              element={(
                <Suspense fallback={<LoadingMessage message="Loading customer orders…" />}>
                  <CatalogueOrdersPage />
                </Suspense>
              )}
            />
            <Route
              path="partners"
              element={(
                <Suspense fallback={<LoadingMessage message="Loading business partners…" />}>
                  <BusinessPartnersPage />
                </Suspense>
              )}
            />
            <Route
              path="catalogue"
              element={(
                <Suspense fallback={<LoadingMessage message="Loading catalogue…" />}>
                  <CataloguePage />
                </Suspense>
              )}
            />
            <Route
              path="state-map"
              element={(
                <Suspense fallback={<LoadingMessage message="Loading India state map…" />}>
                  <StateMapPage />
                </Suspense>
              )}
            />
            <Route path="theme" element={<ThemePage />} />
            </Route>
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </LanguageProvider>
  )
}

export default App
