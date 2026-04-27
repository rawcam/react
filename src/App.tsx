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
import './index.css';

// очистка старых ключей
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

// обёртка fetch с тайм-аутом 10 секунд
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch(input, { ...init, signal: controller.signal })
      .then(response => {
        clearTimeout(timeout);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timeout);
        reject(err);
      });
  });
};

// переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_PROXY_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Отсутствуют переменные окружения Supabase');
}

// создаём клиент с кастомным fetch и autoRefreshToken: false
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1120', color: 'white' }}>
    <h2>Загрузка...</h2>
  </div>
);

const AppContent = () => {
  // ... весь код без изменений, кроме добавленной fetchWithTimeout выше
  // оставьте предыдущую версию (с прокси и autoRefreshToken: false)
  // главное — вставьте fetchWithTimeout и пробросьте в клиент
  // (остальной код такой же, как в прошлом сообщении про прокси)
  // ...
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
