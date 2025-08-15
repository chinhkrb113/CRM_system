import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/theme'
import { AuthProvider } from '@/components/auth/auth-provider'
import { QueryProvider } from '@/lib/query-client'
import { Layout } from '@/components/layout/layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Login } from '@/pages/auth/login'
import { Dashboard } from '@/pages/dashboard/dashboard'
import { Leads } from '@/pages/leads/leads'
import { Appointments } from '@/pages/appointments/appointments'
import { Todos } from '@/pages/todos/todos'
import { Teams } from '@/pages/teams/teams'
import { StudentProfile } from '@/pages/training/student-profile'
import { TrainingTasks } from '@/pages/training/training-tasks'
import { Jobs } from '@/pages/jobs/jobs'
import '@/i18n'

function App() {
  const { theme, applyTheme } = useThemeStore()

  useEffect(() => {
    applyTheme()
  }, [theme, applyTheme])

  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="teams" element={<Teams />} />
              <Route path="tasks" element={<Todos />} />
              <Route path="training-tasks" element={<TrainingTasks />} />
              <Route path="student-profile" element={<StudentProfile />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="analytics" element={<div>Analytics Page - Coming Soon</div>} />
              <Route path="settings" element={<div>Settings Page - Coming Soon</div>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
