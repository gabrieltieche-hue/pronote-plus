import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Timetable from './pages/Timetable'
import Homeworks from './pages/Homeworks'
import { ErrorBoundary } from './components/ErrorBoundary'

function ProtectedRoute({ children }) {
  const { token } = useApp()
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

function AppRoutes() {
  const { token } = useApp()
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={token ? <Navigate to="/app" replace /> : <Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/subject/:subjectName"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        }
      />
      <Route
        path="/homeworks"
        element={
          <ProtectedRoute>
            <Homeworks />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ConsoleBanner() {
  useEffect(() => {
    const c = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#B8BEFD' : '#4742df'
    console.log(
      `%c\n  Pronote+ v0.2.0\n  L'interface augmentée de Pronote\n  https://github.com/yorictieche/pronote-plus\n`,
      `color: ${c}; font-size: 13px; font-weight: 600;`
    )
    console.log(
      '%c⚠️ Avertissement\n%cUtiliser cette console peut permettre à des attaquants de t\'usurper. Ne colle jamais de code que tu ne comprends pas.',
      'color: rgb(223, 98, 98); font-size: 14px; font-weight: bold; -webkit-text-stroke: 1px black;',
      'color: inherit; font-size: 12px;'
    )
  }, [])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ConsoleBanner />
        <AppRoutes />
      </AppProvider>
    </ErrorBoundary>
  )
}
