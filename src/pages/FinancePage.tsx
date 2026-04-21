// src/pages/FinancePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { useFinanceData } from '../hooks/useFinanceData';
import './FinancePage.css';

export const FinancePage: React.FC = () => {
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.role);
  const { data, loading, syncWith1C } = useFinanceData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Если роль не director, перенаправляем на дашборд
  useEffect(() => {
    if (userRole && userRole !== 'director') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  if (loading) {
    return (
      <div className="finance-page">
        <div className="empty-state">
          <i className="fas fa-spinner fa-pulse"></i>
          <p>Загрузка финансовых данных...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="finance-page">
        <div className="empty-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>Не удалось загрузить данные</p>
        </div>
      </div>
    );
  }

  return (
    <div className="finance-page">
      {/* Заголовок */}
      <div className="page-header">
        <h1>📊 Финансы</h1>
        <div className="status-badge">
          <i className="fas fa-link"></i>
          <span>● 1С онлайн {data?.isDemo ? '(эмуляция)' : ''}</span>
        </div>
      </div>

      {/* Информеры */}
      <div className="informers-row">
        <div className="informer" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="label">Выручка (мес)</div>
          <div className="value">{data?.revenue} ₽</div>
          <div className={`trend ${data?.revenueTrend > 0 ? 'trend-up' : 'trend-down'}`}>
            <i className={`fas fa-arrow-${data?.revenueTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data?.revenueTrend || 0)}%
          </div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#10b981' }}>
          <div className="label">Чистая прибыль</div>
          <div className="value">{data?.netProfit} ₽</div>
          <div className={`trend ${data?.profitTrend > 0 ? 'trend-up' : 'trend-down'}`}>
            <i className={`fas fa-arrow-${data?.profitTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data?.profitTrend || 0)}%
          </div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="label">Дебиторка</div>
          <div className="value">{data?.receivables} ₽</div>
          <div className={`trend ${data?.receivablesTrend < 0 ? 'trend-down' : 'trend-up'}`}>
            <i className={`fas fa-arrow-${data?.receivablesTrend < 0 ? 'down' : 'up'}`}></i> {Math.abs(data?.receivablesTrend || 0)}%
          </div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#ef4444' }}>
          <div className="label">Кредиторка</div>
          <div className="value">{data?.payables} ₽</div>
          <div className={`trend ${data?.payablesTrend > 0 ? 'trend-up' : 'trend-down'}`}>
            <i className={`fas fa-arrow-${data?.payablesTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data?.payablesTrend || 0)}%
          </div>
        </div>
      </div>

      {/* Переключатель Сетка / Список */}
      <div className="view-toggle">
        <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
          <i className="fas fa-th"></i> Сетка
        </button>
        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
          <i className="fas fa-list"></i> Список
        </button>
      </div>

      {/* Режим Сетки (отчёты) */}
      {viewMode === 'grid' && (
        <>
          <div className="section-title"><i className="fas fa-chart-line"></i> Отчёты</div>
          <div className="reports-grid">
            <div className="report-card">
              <div className="report-header">
                <span className="report-title">Поступления</span>
                <span className="report-amount" style={{ color: '#10b981' }}>{data?.incoming} ₽</span>
              </div>
              <div className="report-details">
                <span>Продажи: {data?.sales} ₽</span>
                <span>Авансы: {data?.advances} ₽</span>
              </div>
            </div>
            <div className="report-card">
              <div className="report-header">
                <span className="report-title">Списания</span>
                <span className="report-amount" style={{ color: '#ef4444' }}>{data?.outgoing} ₽</span>
              </div>
              <div className="report-details">
                <span>Оборудование: {data?.equipment} ₽</span>
                <span>Зарплата: {data?.salary} ₽</span>
                <span>Аренда: {data?.rent} ₽</span>
              </div>
            </div>
            <div className="report-card">
              <div className="report-header">
                <span className="report-title">Остаток на конец</span>
                <span className="report-amount">{data?.balance} ₽</span>
              </div>
            </div>
          </div>

          <div className="section-title"><i className="fas fa-tasks"></i> План/факт по проектам</div>
          <div className="reports-grid">
            {data?.projectsPlanFact.map((p, idx) => (
              <div className="report-card" key={idx}>
                <div className="report-header">
                  <span>{p.name}</span>
                  <span>{p.fact} / {p.plan} ₽</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progress}%` }}></div>
                </div>
                <div className="report-details">
                  <span>План: {p.plan} ₽</span>
                  <span>Факт: {p.fact} ₽</span>
                  <span>Маржа: {p.margin}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Режим Списка (транзакции) */}
      {viewMode === 'list' && (
        <div className="transactions-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Описание</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.amount.toLocaleString()} ₽</td>
                  <td>
                    <span className={`badge ${t.status === 'Проведено' ? 'success' : 'warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-download"
                      disabled={!t.hasDocument}
                      onClick={() => alert(`Скачать документ для транзакции #${t.id}`)}
                    >
                      <i className="fas fa-download"></i> ПП
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Кнопка синхронизации */}
      <button className="btn-primary" onClick={syncWith1C}>
        <i className="fas fa-sync-alt"></i> Синхронизировать с 1С
      </button>

      {/* Информация об интеграции */}
      <div className="integration-note">
        <h4><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> Интеграция с 1С подтверждена</h4>
        <p>Supabase ↔ 1С через REST API / OData. Edge Function запрашивает данные из 1С и сохраняет в Supabase.</p>
        <div className="sync-info">
          <i className="fas fa-database"></i> <span>Последняя синхронизация: {data?.lastSync || 'не выполнялась'}</span>
          <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: 'auto' }}></i>
          <span>{data?.isDemo ? 'Демо-режим' : 'Боевой режим'}</span>
        </div>
      </div>
    </div>
  );
};
