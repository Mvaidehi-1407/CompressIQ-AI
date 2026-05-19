import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import UploadCenter from './pages/UploadCenter'
import CompressionCenter from './pages/CompressionCenter'
import ProtectionVault from './pages/ProtectionVault'
import Analytics from './pages/Analytics'
import SplashScreen from './components/SplashScreen'
import { useState } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) fetchMe()
    const t = setTimeout(() => setSplash(false), 2200)
    return () => clearTimeout(t)
  }, [])

  if (splash) return <SplashScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UploadCenter />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/compress"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CompressionCenter />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/protect"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProtectionVault />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
