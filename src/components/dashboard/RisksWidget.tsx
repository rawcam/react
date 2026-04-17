// src/components/dashboard/RisksWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';

export const RisksWidget: React.FC = () => {
  const navigate = useNavigate();
  const projects = useSelector((state: RootState) => state.projects.list);
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

  if (!hasRole('director') && !hasRole('pm')) return null;

  const riskyProjects = projects
    .filter(p => p.status !== 'done')
    .map(p => {
      const planned = p.roadmapPlanned.find(r => r.status === p.status);
      const actual = p.roadmapActual.find(r => r.status === p.status);
      if (!planned || !actual) return null;
      const plannedDate = new Date(planned.date);
      const actualDate = new Date(actual.date);
      const delay = Math.max(0, Math.ceil((actualDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24)));
      return { id: p.id, name: p.name, shortId: p.shortId, delay };
    })
    .filter(r => r !== null && r.delay > 7)
    .sort((a, b) => b!.delay - a!.delay)
    .slice(0, 5) as { id: string; name: string; shortId: string; delay: number }[];

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/risks');
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
          <i className="fas fa-exclamation-triangle"></i>
          <div className="compact-value">{riskyProjects.length}</div>
          <div className="compact-label">С риском</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleWidgetClick}>
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <i className="fas fa-exclamation-triangle"></i> Риски (задержки)
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
        {riskyProjects.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>Нет критических задержек</p>
        ) : (
          riskyProjects.map(p => (
            <div key={p.id} className="dashboard-risk-row">
              <span className="dashboard-risk-name">[{p.shortId}] {p.name}</span>
              <span className="dashboard-risk-delay" style={{ color: 'var(--danger)' }}>+{p.delay} дн.</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
