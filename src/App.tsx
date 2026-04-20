// src/App.tsx
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store';
import { supabase } from './lib/supabaseClient';
import { setSession, setRole } from './store/authSlice';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CalculationsPage } from './pages/CalculationsPage';
import { SpecificationsListPage } from './pages/SpecificationsListPage';
import { SpecificationPage } from './pages/SpecificationPage';
import FlowEditorPage from './pages/FlowEditorPage';
import { LoginPage } from './pages/LoginPage';
import './index.css';

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: number;

    const initAuth = async () => {
      try {
        console.log('[Auth] Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        dispatch(setSession(session));
        console.log('[Auth] Session:', session ? 'exists' : 'null');

        if (session?.user) {
          console.log('[Auth] User:', session.user.email);
          const { data, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (roleError) {
            console.warn('[Auth] Role fetch error:', roleError);
            dispatch(setRole('engineer')); // fallback
          } else if (data) {
            console.log('[Auth] Role:', data.role);
            dispatch(setRole(data.role));
          } else {
            console.warn('[Auth] No role found, using engineer');
            dispatch(setRole('engineer'));
          }
        }
      } catch (err: any) {
        console.error('[Auth] Init error:', err);
        setError(err.message);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        console.log('[Auth] Initialization complete');
      }
    };

    // Защитный таймаут — если инициализация зависла, всё равно показываем приложение
    timeoutId = window.setTimeout(() => {
      console.warn('[Auth] Initialization timeout — forcing ready state');
      setIsLoading(false);
    }, 5000);

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] State changed:', _event);
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

    return () => {
      clearTimeout(timeoutId);
      listener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="loading-screen" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a1120', color: 'white'
      }}>
        <h2>Загрузка...</h2>
        {error && <p style={{ color: '#f87171', marginTop: 16 }}>Ошибка: {error}</p>}
        <p style={{ fontSize: 12, marginTop: 20, opacity: 0.7 }}>Если загрузка длится долго, обновите страницу</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <HashRouter>
        {user ? (
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
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
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
