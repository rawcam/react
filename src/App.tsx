// src/App.tsx
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createClient } from '@supabase/supabase-js';
import { store, RootState } from './store';
import { setSession, setRole, setLoading } from './store/authSlice';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SpecificationsListPage } from './pages/SpecificationsListPage';
import { SpecificationPage } from './pages/SpecificationPage';
import { LoginPage } from './pages/LoginPage';
import { FinancePage } from './pages/FinancePage';
import FlowEditorPage from './pages/FlowEditorPage';
import { CalculationsPage } from './pages/CalculationsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { VacationRequestsPage } from './pages/VacationRequestsPage';
import { WorkReportsPage } from './pages/WorkReportsPage';
import { useProjectsSupabase } from './hooks/useProjectsSupabase';
import { useSpecificationsSupabase } from './hooks/useSpecificationsSupabase';
import { FinanceOverviewPage } from './pages/FinanceOverviewPage';
import { FinanceTaxesPage } from './pages/FinanceTaxesPage';
import { FinanceOverheadPage } from './pages/FinanceOverheadPage';
import { FinanceStaffPage } from './pages/FinanceStaffPage';
import { FinanceStatisticsPage } from './pages/FinanceStatisticsPage';
import './index.css';

const clearStorage = () => {
  const keysToRemove = ['userRole', 'userName', 'theme'];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key);
  });
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-')) sessionStorage.removeItem(key);
  });
};
clearStorage();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,   // теперь Supabase сам обновляет токен
  },
});

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1120', color: 'white' }}>
    <h2>Загрузка...</h2>
  </div>
);

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const [initError, setInitError] = useState<string | null>(null);
  const { loadProjects } = useProjectsSupabase();
  const { loadSpecifications } = useSpecificationsSupabase();

  useEffect(() => {
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
      } catch (err: any) {
        console.error('Auth init error:', err);
        setInitError(err.message);
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

  // Предзагрузка всех данных после логина
  useEffect(() => {
    if (user) {
      loadProjects().catch(console.error);
      loadSpecifications().catch(console.error);
    }
  }, [user, loadProjects, loadSpecifications]);

  if (isLoading) return <LoadingScreen />;
  if (initError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1120', color: 'white', flexDirection: 'column' }}>
        <h2>Ошибка инициализации</h2>
        <p>{initError}</p>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
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
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/calculations" element={<CalculationsPage />} />
                <Route path="/specifications" element={<SpecificationsListPage />} />
                <Route path="/specification/:id" element={<SpecificationPage />} />
                <Route path="/specification" element={<SpecificationPage />} />
                <Route path="/flow-editor" element={<FlowEditorPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/my-profile" element={<MyProfilePage />} />
                <Route path="/vacation-requests" element={<VacationRequestsPage />} />
                <Route path="/work-reports" element={<WorkReportsPage />} />
                <Route path="/finance/overview" element={<FinanceOverviewPage />} />
                <Route path="/finance/taxes" element={<FinanceTaxesPage />} />
                <Route path="/finance/overhead" element={<FinanceOverheadPage />} />
                <Route path="/finance/staff" element={<FinanceStaffPage />} />
                <Route path="/finance/statistics" element={<FinanceStatisticsPage />} />
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
