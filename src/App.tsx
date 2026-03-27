import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Topbar } from './components/layout/Topbar'
import { Sidebar } from './components/layout/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { CalculationsPage } from './pages/CalculationsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import './styles/App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Topbar />
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/calculations" element={<CalculationsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
