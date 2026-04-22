// src/components/dashboard/CompanyFinanceWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useAuth } from '../../hooks/useAuth';

export const CompanyFinanceWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceData('month');
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

  if (!hasRole(['director', 'pm'])) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/finance');
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

  if (loading || !data) {
    return (
      <div className="dashboard-widget">
        <div className="dashboard-widget-header">
          <div className="dashboard-widget-title"><i className="fas fa-chart-line"></i> Финансы компании</div>
        </div>
        <div className="dashboard-widget-content">Загрузка...</div>
      </div>
    );
  }

  if (displayMode === 'compact') {
    return (
      <div className="dashboard-widget compact-widget" onClick={handleWidgetClick}>
        <div className="compact-widget-content">
          <i className="fas fa-chart-line"></i>
          <div className="compact-value">{formatCurrency(data.kpi.revenue)}</div>
          <div className="compact-label">Выручка</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleWidgetClick}>
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-title">
          <i className="fas fa-chart-line"></i> Финансы компании
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
          <span className="dashboard-finance-label">Выручка (факт)</span>
          <span className="dashboard-finance-value">
            {formatCurrency(data.kpi.revenue)}
            <span className={`dashboard-trend ${data.kpi.revenueTrend > 0 ? 'up' : 'down'}`}>
              <i className={`fas fa-arrow-${data.kpi.revenueTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data.kpi.revenueTrend)}%
            </span>
          </span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Маржа (факт)</span>
          <span className="dashboard-finance-value">
            {formatCurrency(data.kpi.netProfit)}
            <span className={`dashboard-trend ${data.kpi.profitTrend > 0 ? 'up' : 'down'}`}>
              <i className={`fas fa-arrow-${data.kpi.profitTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data.kpi.profitTrend)}%
            </span>
          </span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Рентабельность</span>
          <span className="dashboard-finance-value">
            {data.kpi.revenue > 0 ? ((data.kpi.netProfit / data.kpi.revenue) * 100).toFixed(1) : '0.0'}%
          </span>
        </div>
        {data.kpi.payables > 0 && (
          <div className="dashboard-finance-row">
            <span className="dashboard-finance-label">Кредиторка</span>
            <span className="dashboard-finance-value">{formatCurrency(data.kpi.payables)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
