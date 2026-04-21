// src/components/dashboard/ServiceWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';

export const ServiceWidget: React.FC = () => {
  const navigate = useNavigate();
  const projects = useSelector((state: RootState) => state.projects.list);
  const serviceVisits = useSelector((state: RootState) => state.serviceVisits.list);
  const { hasRole } = useAuth();
  const displayMode = useSelector((state: RootState) => state.widgets.displayMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Добавлен 'director' в список разрешённых ролей
  if (!hasRole(['director', 'pm', 'engineer'])) return null;

  const allVisits = projects.flatMap(p => p.serviceVisits);
  const planned = allVisits.filter(v => v.status === 'planned').length;
  const completed = allVisits.filter(v => v.status === 'completed').length;

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/service');
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    if (action === 'refresh') alert('Обновление данных (демо)');
    else if (action === 'export') alert('Экспорт CSV (демо)');
    else if (action === 'settings') alert('Настройки виджета (демо)');
    else if (action === 'hide') alert('Используйте панель настроек для скрытия виджета');
  };

  if (displayMode === 'compact') {
    return (
      <div className="dashboard-widget compact-widget" onClick={handleWidgetClick}>
        <div className="compact-widget-content">
          <i className="fas fa-tools"></i>
          <div className="compact-value">{planned}</div>
          <div className="compact-label">Запланировано</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleWidgetClick}>
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <i className="fas fa-tools"></i> Сервис и регламент
        </div>
        <div className="dashboard-widget-actions">
          <button ref={buttonRef} className="dashboard-icon-btn" onClick={handleMenuToggle}>
            <i className="fas fa-ellipsis-h"></i>
          </button>
          {menuOpen && (
            <div className="dashboard-widget-menu" ref={menuRef}>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('refresh')}>Обновить</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('export')}>Экспорт CSV</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('settings')}>Настройки</div>
              <div className="dashboard-widget-menu-item" onClick={() => handleMenuAction('hide')}>Скрыть виджет</div>
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-widget-content">
        <div className="dashboard-service-row">
          <span className="dashboard-service-label">Запланировано выездов</span>
          <span className="dashboard-service-value">{planned}</span>
        </div>
        <div className="dashboard-service-row">
          <span className="dashboard-service-label">Выполнено</span>
          <span className="dashboard-service-value">{completed}</span>
        </div>
        <div className="dashboard-service-row">
          <span className="dashboard-service-label">Всего в базе</span>
          <span className="dashboard-service-value">{serviceVisits.length}</span>
        </div>
      </div>
    </div>
  );
};
