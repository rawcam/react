// src/App.tsx
import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './store';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CalculationsPage } from './pages/CalculationsPage';
import { SpecificationsListPage } from './pages/SpecificationsListPage';
import { SpecificationPage } from './pages/SpecificationPage';
import FlowEditorPage from './pages/FlowEditorPage';
import './index.css';

const AppContent = () => {
  const theme = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
      window.location.href = '/reactflow/login.html';
    }
  }, []);

  // Дополнительная гарантия, что класс body соответствует теме
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return (
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
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
