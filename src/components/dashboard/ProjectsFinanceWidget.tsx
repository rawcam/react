// src/components/dashboard/ProjectsFinanceWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useFinance } from '../../hooks/useFinance';
import { useAuth } from '../../hooks/useAuth';

export const ProjectsFinanceWidget: React.FC = () => {
  const navigate = useNavigate();
  const projects = useSelector((state: RootState) => state.projects.list);
  const { totalMargin: companyMargin, totalProfitability: companyProfitability } = useFinance();
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

  if (!hasRole('director') && !hasRole('pm') && !hasRole('engineer')) return null;

  const activeProjects = projects.filter(p => p.status !== 'done');
  const totalContract = projects.reduce((sum, p) => sum + p.contractAmount, 0);
  const totalActualIncome = projects.reduce((sum, p) => sum + p.actualIncome, 0);
  const totalActualExpenses = projects.reduce((sum, p) => sum + p.actualExpenses, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/projects');
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
          <i className="fas fa-chart-pie"></i>
          <div className="compact-value">{activeProjects.length}</div>
          <div className="compact-label">Активных</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleWidgetClick}>
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <i className="fas fa-chart-pie"></i> Финансы проектов
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
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Активных проектов</span>
          <span className="dashboard-finance-value">{activeProjects.length} / {projects.length}</span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Общий контракт</span>
          <span className="dashboard-finance-value">{formatCurrency(totalContract)}</span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Выручка (факт)</span>
          <span className="dashboard-finance-value">{formatCurrency(totalActualIncome)}</span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Расходы (факт)</span>
          <span className="dashboard-finance-value">{formatCurrency(totalActualExpenses)}</span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Маржа (компания)</span>
          <span className="dashboard-finance-value">
            {formatCurrency(companyMargin)} ({(companyProfitability * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
