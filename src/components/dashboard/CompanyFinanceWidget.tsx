// src/components/dashboard/CompanyFinanceWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useFinance } from '../../hooks/useFinance';
import { useAuth } from '../../hooks/useAuth';

export const CompanyFinanceWidget: React.FC = () => {
  const navigate = useNavigate();
  const { totalIncome, totalMargin, totalProfitability, nextCompanyGap } = useFinance();
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

  const trends = {
    income: { value: 8.2, positive: true },
    margin: { value: 5.4, positive: true },
    profitability: { value: 1.2, positive: true },
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dashboard-widget-actions')) return;
    navigate('/finance/company');
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
          <i className="fas fa-chart-line"></i>
          <div className="compact-value">{formatCurrency(totalIncome)}</div>
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
            {formatCurrency(totalIncome)}
            <span className={`dashboard-trend ${trends.income.positive ? 'up' : 'down'}`}>
              <i className={`fas fa-arrow-${trends.income.positive ? 'up' : 'down'}`}></i> {Math.abs(trends.income.value)}% за мес.
            </span>
          </span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Маржа (факт)</span>
          <span className="dashboard-finance-value">
            {formatCurrency(totalMargin)}
            <span className={`dashboard-trend ${trends.margin.positive ? 'up' : 'down'}`}>
              <i className={`fas fa-arrow-${trends.margin.positive ? 'up' : 'down'}`}></i> {Math.abs(trends.margin.value)}%
            </span>
          </span>
        </div>
        <div className="dashboard-finance-row">
          <span className="dashboard-finance-label">Рентабельность</span>
          <span className="dashboard-finance-value">
            {(totalProfitability * 100).toFixed(1)}%
            <span className={`dashboard-trend ${trends.profitability.positive ? 'up' : 'down'}`}>
              <i className={`fas fa-arrow-${trends.profitability.positive ? 'up' : 'down'}`}></i> {Math.abs(trends.profitability.value)} п.п.
            </span>
          </span>
        </div>
        {nextCompanyGap && (
          <div className="dashboard-finance-row">
            <span className="dashboard-finance-label">Кассовый разрыв</span>
            <span className="dashboard-finance-value" style={{ color: 'var(--danger)' }}>
              {formatCurrency(nextCompanyGap.deficit)}
              <span className="dashboard-trend down">до {nextCompanyGap.date}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
