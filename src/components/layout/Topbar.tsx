// src/components/layout/Topbar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleTheme } from '../../store/themeSlice';
import { openWidgetConfig } from '../../store/uiSlice';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const userRole = useSelector((state: RootState) => state.auth.user?.role) || 'director';

  const navItems = [
    { path: '/dashboard', label: 'Главная' },
    { path: '/finance', label: 'Финансы', roles: ['director'] },
    { path: '/projects', label: 'Проекты' },
    { path: '/calculations', label: 'Расчёты' },
    { path: '/specifications', label: 'Спецификации' },
    { path: '/flow-editor', label: 'Редактор' },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Директор';
      case 'pm': return 'ГИП';
      case 'engineer': return 'Инженер';
      case 'designer': return 'Проектировщик';
      case 'logist': return 'Логист';
      default: return role;
    }
  };

  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <div className="topbar">
      <div className="logo" onClick={() => navigate('/dashboard')}>
        Sputnik Studio
      </div>
      <div className="nav-buttons">
        {filteredNavItems.map(item => (
          <button
            key={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" onClick={() => dispatch(openWidgetConfig())}>
          <i className="fas fa-sliders-h"></i>
        </button>
        <button className="icon-btn" onClick={() => dispatch(toggleTheme())}>
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <span className="role-badge">
          <i className="fas fa-user-circle" style={{ marginRight: 6 }}></i>
          {getRoleLabel(userRole)}
        </span>
      </div>
    </div>
  );
};
