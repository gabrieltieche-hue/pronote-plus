import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Grades from './pages/Grades'
import Timetable from './pages/Timetable'
import Homeworks from './pages/Homeworks'
import VieScolaire from './pages/VieScolaire'
import Messaging from './pages/Messaging'
import Settings from './pages/Settings'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'

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
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
      <Route path="/grades/subject/:subjectName" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
      <Route path="/app/subject/:subjectName" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
      <Route path="/homeworks" element={<ProtectedRoute><Homeworks /></ProtectedRoute>} />
      <Route path="/vie-scolaire" element={<ProtectedRoute><VieScolaire /></ProtectedRoute>} />
      <Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ConsoleBanner() {
  const { theme } = useApp()
  useEffect(() => {
    const c = theme === 'dark' ? '#B8BEFD' : '#4742df'
    console.log(
      `%c\n  Pronote+ v0.3.2\n  L'interface augmentée de Pronote\n`,
      `color: ${c}; font-size: 13px; font-weight: 600;`
    )
    console.log(
      '%c⚠️ Avertissement\n%cUtiliser cette console peut permettre à des attaquants de t\'usurper. Ne colle jamais de code que tu ne comprends pas.',
      'color: rgb(223, 98, 98); font-size: 14px; font-weight: bold; -webkit-text-stroke: 1px black;',
      'color: inherit; font-size: 12px;'
    )
  }, [theme])
  return null
}

function ReduceMotion() {
  const { prefs } = useApp()
  useEffect(() => {
    if (prefs.reduceMotion) document.documentElement.classList.add('reduce-motion')
    else document.documentElement.classList.remove('reduce-motion')
  }, [prefs.reduceMotion])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ReduceMotion />
        <ConsoleBanner />
        <AppRoutes />
        <ToastContainer />
      </AppProvider>
    </ErrorBoundary>
  )
}
