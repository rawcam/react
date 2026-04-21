// src/App.tsx
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store';
import { supabase } from './lib/supabaseClient';
import { setSession, setRole, setLoading } from './store/authSlice';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CalculationsPage } from './pages/CalculationsPage';
import { SpecificationsListPage } from './pages/SpecificationsListPage';
import { SpecificationPage } from './pages/SpecificationPage';
import FlowEditorPage from './pages/FlowEditorPage';
import { LoginPage } from './pages/LoginPage';
import './index.css';

// Ключи, которые могут содержать старые данные и мешать
const STORAGE_KEYS_TO_CLEAR = [
  'userRole',
  'userName',
  'supabase.auth.token',
  'sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token',
];

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1120', color: 'white' }}>
    <h2>Загрузка...</h2>
  </div>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const [shouldReload, setShouldReload] = useState(false);

  useEffect(() => {
    // Очищаем ВСЕ ключи, которые могут хранить старую сессию или роль
    STORAGE_KEYS_TO_CLEAR.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Также очищаем всё, что начинается с 'sb-'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-')) sessionStorage.removeItem(key);
    });
    console.log('[Startup] Local/session storage cleared.');

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        dispatch(setSession(session));
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (!error && data) {
            dispatch(setRole(data.role));
          } else {
            dispatch(setRole('engineer'));
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        dispatch(setLoading(false));
      }
    };
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      dispatch(setSession(session));
      if (session?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        dispatch(setRole(data?.role || 'engineer'));
      } else {
        dispatch(setRole(null));
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [dispatch]);

  // Если после очистки хранилища мы не получили сессию, но ранее были залогинены,
  // принудительно перезагружаем страницу один раз.
  useEffect(() => {
    if (!isLoading && !user && !shouldReload) {
      const hadOldSession = localStorage.getItem('supabase.auth.token') !== null;
      if (hadOldSession) {
        console.log('[Startup] Old session detected but no valid user, reloading...');
        setShouldReload(true);
        window.location.reload();
      }
    }
  }, [isLoading, user, shouldReload]);

  if (isLoading || shouldReload) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }

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
