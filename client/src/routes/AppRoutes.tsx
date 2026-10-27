import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AboutPage from '../pages/AboutPage'
import ContactPage from '../pages/ContactPage'
import NotFoundPage from '../pages/NotFoundPage'
import ThemePage from '../pages/ThemePage'
import DashboardLayout from '../components/DashboardLayout'
import AuthLayout from '../modules/auth/AuthLayout'
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage'
import LoginPage from '../modules/auth/pages/LoginPage'
import RegisterPage from '../modules/auth/pages/RegisterPage'
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage'
import VerifyOtpPage from '../modules/auth/pages/VerifyOtpPage'
import RequireAuth from '../modules/auth/RequireAuth'
import { AccessDeniedPage, HomePageAccess, RequirePageAccess } from '../modules/auth/PageAccessGuard'
import '../App.css'

const CataloguePage = lazy(() => import('../pages/CataloguePage'))
const CatalogueCardsPage = lazy(() => import('../pages/CatalogueCardsPage'))
const CataloguePdfPage = lazy(() => import('../pages/CataloguePdfPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'))

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<HomePageAccess />} />
          <Route
            path="catalogue"
            element={(
              <Suspense fallback={<div className="catalogue-loading" role="status">Loading parts catalogue…</div>}>
                <CataloguePage />
              </Suspense>
            )}
          />
          <Route
            path="catalogue/cards"
            element={(
              <Suspense fallback={<div className="catalogue-loading" role="status">Loading parts catalogue…</div>}>
                <CatalogueCardsPage />
              </Suspense>
            )}
          />
          <Route
            path="catalogue/pdf"
            element={(
              <Suspense fallback={<div className="catalogue-loading" role="status">Preparing printable catalogue…</div>}>
                <CataloguePdfPage />
              </Suspense>
            )}
          />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route element={<RequirePageAccess page="about" />}>
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route element={<RequirePageAccess page="contact" />}>
            <Route path="contact" element={<ContactPage />} />
          </Route>
          <Route path="access-denied" element={<AccessDeniedPage />} />
          <Route path="theme" element={<ThemePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
