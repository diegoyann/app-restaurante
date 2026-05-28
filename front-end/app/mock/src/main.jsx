import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './components/SearchableSelect.css'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import TenantApp from './pages/TenantApp.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicMenuPage from './pages/PublicMenuPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cardapio/:tenant" element={<PublicMenuPage />} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute mode="admin">
              <AdminPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app"
          element={(
            <ProtectedRoute mode="tenant">
              {({ tenantSlug }) => <TenantApp tenantSlug={tenantSlug} />}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/:tenant"
          element={(
            <ProtectedRoute mode="tenant">
              {({ tenantSlug }) => <TenantApp tenantSlug={tenantSlug} />}
            </ProtectedRoute>
          )}
        />
        <Route path="/notfound" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
