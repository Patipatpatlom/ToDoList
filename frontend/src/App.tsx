import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Layout } from './components/Layout'

// Lazy-loaded route chunks for code splitting and faster initial load
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)

// Centered loading fallback for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <span className="text-xs font-semibold text-slate-400 tracking-wide">
        Loading TaskFlow...
      </span>
    </div>
  </div>
)

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected / App Routes with Common Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
