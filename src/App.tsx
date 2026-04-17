// src/App.tsx
import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';
import { store } from './store';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CalculationsPage } from './pages/CalculationsPage';
import { SpecificationsListPage } from './pages/SpecificationsListPage';
import { SpecificationPage } from './pages/SpecificationPage';
import FlowEditorPage from './pages/FlowEditorPage';
import './index.css';

function App() {
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
      // Если роль не сохранена, отправляем на страницу входа
      window.location.href = '/reactflow/login.html';
    }
  }, []);

  return (
    <Provider store={store}>
      <ReactFlowProvider>
        <HashRouter>
          <div className="app">
            <Topbar />
            <div className="app-layout">
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/calculations" element={<CalculationsPage />} />
                  <Route path="/specifications" element={<SpecificationsListPage />} />
                  <Route path="/specification/:id" element={<SpecificationPage />} />
                  <Route path="/specification" element={<SpecificationPage />} />
                  <Route path="/flow-editor" element={<FlowEditorPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      </ReactFlowProvider>
    </Provider>
  );
}

export default App;
