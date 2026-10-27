import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import AdminPage from './components/AdminPage'
import RolePage from './components/RolePage'
import ThemePage from './components/ThemePage'
import NotFoundPage from './pages/NotFoundPage'
import RequireAdmin from './components/RequireAdmin'
import AuthLayout from './modules/auth/AuthLayout'
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage'
import LoginPage from './modules/auth/pages/LoginPage'
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage'
import VerifyOtpPage from './modules/auth/pages/VerifyOtpPage'
import RequireAuth from './modules/auth/RequireAuth'
import './App.css'

function App() {
  return (
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
            <Route index element={<AdminPage />} />
            <Route path="roles" element={<RolePage />} />
            <Route path="theme" element={<ThemePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
