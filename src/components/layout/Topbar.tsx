// src/components/layout/Topbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { setRole } from '../../store/authSlice';
import { openWidgetConfig } from '../../store/uiSlice';

const Topbar: React.FC = () => {
  const { user, hasRole } = useAuth();
  const dispatch = useDispatch();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setRole(e.target.value as any));
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <NavLink to="/dashboard" className="logo">
          <i className="fas fa-broadcast-tower" style={{ marginRight: 8 }}></i>
          Sputnik Studio
        </NavLink>
      </div>

      <nav className="topbar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-chart-pie"></i> Дашборд
        </NavLink>
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
            </select>
          ) : (
            <span className="role-badge">{user?.role}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export { Topbar };
