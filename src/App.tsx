import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { HomePage } from './pages/HomePage'
import { CommandsPage } from './pages/CommandsPage'
import { StatusPage } from './pages/StatusPage'
import { EmbedPage } from './pages/EmbedPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OverviewPage } from './pages/dashboard/OverviewPage'
import { GeneralPage } from './pages/dashboard/GeneralPage'
import { MessagesPage } from './pages/dashboard/MessagesPage'
import { AutoRolesPage } from './pages/dashboard/AutoRolesPage'
import { AliasesPage } from './pages/dashboard/AliasesPage'
import { AntiNukePage } from './pages/dashboard/AntiNukePage'
import { HoneypotPage } from './pages/dashboard/HoneypotPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/commands" element={<CommandsPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="general" element={<GeneralPage />} />
        <Route path="welcome" element={<MessagesPage module="welcome" />} />
        <Route path="leave" element={<MessagesPage module="leave" />} />
        <Route path="boost" element={<MessagesPage module="boost" />} />
        <Route path="autoroles" element={<AutoRolesPage />} />
        <Route path="aliases" element={<AliasesPage />} />
        <Route path="antinuke" element={<AntiNukePage />} />
        <Route path="honeypot" element={<HoneypotPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
