// src/components/layout/Topbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setRole } from '../../store/authSlice';
import { openWidgetConfig } from '../../store/uiSlice';
import { useAuth } from '../../hooks/useAuth';

export const Topbar: React.FC = () => {
  const dispatch = useDispatch();
  const { user, hasRole } = useAuth();
  const widgetConfigOpen = useSelector((state: RootState) => state.ui.widgetConfigOpen);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as any;
    dispatch(setRole(newRole));
  };

  const handleThemeToggle = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <NavLink to="/" className="logo">
          <i className="fas fa-broadcast-tower" style={{ marginRight: 8 }}></i>
          Sputnik Studio
        </NavLink>
      </div>

      <nav className="topbar-nav">
        <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-folder-open"></i> Проекты
        </NavLink>
        <NavLink to="/calculations" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-calculator"></i> Расчёты
        </NavLink>
        <NavLink to="/specifications" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-table"></i> Спецификации
        </NavLink>
        <NavLink to="/flow-editor" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-project-diagram"></i> Редактор схем
        </NavLink>
      </nav>

      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={handleThemeToggle}>
          <i className={`fas ${document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button className="topbar-icon-btn" onClick={() => dispatch(openWidgetConfig())}>
          <i className="fas fa-th-large"></i>
        </button>
        <button className="topbar-icon-btn">
          <i className="fas fa-bell"></i>
        </button>
        <div className="user-menu">
          <i className="fas fa-user-circle"></i>
          <span>{user?.name || 'Гость'}</span>
          {hasRole('director') ? (
            <select value={user?.role} onChange={handleRoleChange} className="role-switch">
              <option value="engineer">Инженер</option>
              <option value="pm">Руководитель</option>
              <option value="director">Директор</option>
              <option value="designer">Проектировщик</option>
              <option value="logist">Логист</option>
            </select>
          ) : (
            <span className="role-badge">{user?.role === 'pm' ? 'ГИП' : user?.role}</span>
          )}
        </div>
      </div>
    </header>
  );
};
