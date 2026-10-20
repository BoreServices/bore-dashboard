import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { CommandsPage } from './pages/CommandsPage'
import { StatusPage } from './pages/StatusPage'
import { EmbedPage } from './pages/EmbedPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/commands" element={<CommandsPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
