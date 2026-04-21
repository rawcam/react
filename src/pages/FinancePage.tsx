// src/pages/FinancePage.tsx
import React, { useState } from 'react';
import './FinancePage.css';

// Мок-данные для транзакций (10 записей)
const mockTransactions = [
  { id: 1, date: '20.04.2026', description: 'Поступление от заказчика (0002)', amount: 2500000, status: 'completed', ppAvailable: true },
  { id: 2, date: '18.04.2026', description: 'Закупка оборудования (Siemens)', amount: 850000, status: 'completed', ppAvailable: true },
  { id: 3, date: '15.04.2026', description: 'Аванс подрядчику', amount: 420000, status: 'processing', ppAvailable: false },
  { id: 4, date: '12.04.2026', description: 'Зарплата за март', amount: 1200000, status: 'completed', ppAvailable: true },
  { id: 5, date: '10.04.2026', description: 'Поступление от заказчика (0001)', amount: 1800000, status: 'completed', ppAvailable: true },
  { id: 6, date: '05.04.2026', description: 'Закупка кабеля', amount: 320000, status: 'completed', ppAvailable: true },
  { id: 7, date: '02.04.2026', description: 'Аренда офиса', amount: 180000, status: 'completed', ppAvailable: true },
  { id: 8, date: '28.03.2026', description: 'Поступление от заказчика (0003)', amount: 5000000, status: 'completed', ppAvailable: true },
  { id: 9, date: '25.03.2026', description: 'Закупка ПО', amount: 450000, status: 'completed', ppAvailable: true },
  { id: 10, date: '22.03.2026', description: 'Оплата подрядчику', amount: 670000, status: 'processing', ppAvailable: false },
];

export const FinancePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleDownloadPP = (transactionId: number, available: boolean) => {
    if (!available) {
      alert('Платёжное поручение недоступно');
      return;
    }
    alert(`Скачать ПП для транзакции №${transactionId}`);
    // Здесь будет реальная загрузка файла
  };

  const handleSync = () => {
    alert('Демо: запрос к 1С через Supabase Edge Function');
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <h1>📊 Финансы</h1>
        <div className="status-badge">
          <i className="fas fa-link"></i>
          <span>● 1С онлайн (эмуляция)</span>
        </div>
      </div>

      {/* Информеры */}
      <div className="informers-row">
        <div className="informer" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="label">Выручка (мес)</div>
          <div className="value">12.4M ₽</div>
          <div className="trend trend-up"><i className="fas fa-arrow-up"></i> +8.2%</div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#10b981' }}>
          <div className="label">Чистая прибыль</div>
          <div className="value">3.1M ₽</div>
          <div className="trend trend-up"><i className="fas fa-arrow-up"></i> +5.4%</div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="label">Дебиторка</div>
          <div className="value">5.2M ₽</div>
          <div className="trend trend-down"><i className="fas fa-arrow-down"></i> -12%</div>
        </div>
        <div className="informer" style={{ borderLeftColor: '#ef4444' }}>
          <div className="label">Кредиторка</div>
          <div className="value">2.8M ₽</div>
          <div className="trend trend-up"><i className="fas fa-arrow-up"></i> +3.1%</div>
        </div>
      </div>

      {/* Переключатель сетка/список */}
      <div className="view-toggle">
        <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
          <i className="fas fa-th"></i> Сетка
        </button>
        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
          <i className="fas fa-list"></i> Список
        </button>
      </div>

      {viewMode === 'grid' ? (
        <>
          <div className="section-title"><i className="fas fa-chart-line" style={{ color: 'var(--accent)' }}></i> Отчёты</div>
          <div className="reports-grid">
            <div className="report-card">
              <div className="report-header"><span className="report-title">Поступления</span><span className="report-amount" style={{ color: '#10b981' }}>8.7M ₽</span></div>
              <div className="report-details"><span>Продажи: 6.2M ₽</span><span>Авансы: 2.5M ₽</span></div>
            </div>
            <div className="report-card">
              <div className="report-header"><span className="report-title">Списания</span><span className="report-amount" style={{ color: '#ef4444' }}>5.6M ₽</span></div>
              <div className="report-details"><span>Оборудование: 3.1M</span><span>Зарплата: 1.8M</span><span>Аренда: 0.7M</span></div>
            </div>
            <div className="report-card">
              <div className="report-header"><span className="report-title">Остаток на конец</span><span className="report-amount">3.1M ₽</span></div>
            </div>
          </div>

          <div className="section-title"><i className="fas fa-tasks" style={{ color: 'var(--accent)' }}></i> План/факт по проектам</div>
          <div className="reports-grid">
            <div className="report-card">
              <div className="report-header"><span>Офис продаж (0001)</span><span>2.5M / 2.8M ₽</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '89%' }}></div></div>
              <div className="report-details"><span>План: 2.8M</span><span>Факт: 2.5M</span><span>Маржа: 22%</span></div>
            </div>
            <div className="report-card">
              <div className="report-header"><span>Конференц-зал (0002)</span><span>8.7M / 8.7M ₽</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '100%' }}></div></div>
              <div className="report-details"><span>План: 8.7M</span><span>Факт: 8.7M</span><span>Маржа: 31%</span></div>
            </div>
            <div className="report-card">
              <div className="report-header"><span>Школа будущего (0003)</span><span>15.4M / 22.1M ₽</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '70%' }}></div></div>
              <div className="report-details"><span>План: 22.1M</span><span>Факт: 15.4M</span><span>Маржа: 18%</span></div>
            </div>
          </div>
        </>
      ) : (
        <div className="transactions-container">
          <table className="transactions-table">
            <thead>
              <tr><th>Дата</th><th>Описание</th><th>Сумма</th><th>Статус</th><th>Действие</th></tr>
            </thead>
            <tbody>
              {mockTransactions.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  <td>
                    <span className={`badge ${tx.status === 'completed' ? 'success' : 'warning'}`}>
                      {tx.status === 'completed' ? 'Проведено' : 'В обработке'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-download"
                      onClick={() => handleDownloadPP(tx.id, tx.ppAvailable)}
                      disabled={!tx.ppAvailable}
                      style={!tx.ppAvailable ? { opacity: 0.5 } : {}}
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

      <button className="btn-primary" onClick={handleSync}>
        <i className="fas fa-sync-alt"></i> Синхронизировать с 1С (эмуляция)
      </button>

      <div className="integration-note">
        <h4><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> Интеграция с 1С подтверждена</h4>
        <p>Supabase ↔ 1С через REST API / OData. Edge Function запрашивает данные из 1С и сохраняет в Supabase. Возможна репликация в реальном времени.</p>
        <div className="sync-info">
          <i className="fas fa-database"></i> <span>Последняя синхронизация: 21.04.2026 10:23:45</span>
          <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: 'auto' }}></i> <span>Данные из демо-режима</span>
        </div>
      </div>
    </div>
  );
};
