// src/pages/FinancePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { useFinanceData } from '../hooks/useFinanceData';
import { FinanceDetailModal } from '../components/ui/FinanceDetailModal';
import './FinancePage.css';

type InformerCategory = 'all' | 'key' | 'taxes' | 'overhead' | 'staff';

export const FinancePage: React.FC = () => {
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.role);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const { data, loading, error, syncWith1C } = useFinanceData(period);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [informerCategory, setInformerCategory] = useState<InformerCategory>('key');

  useEffect(() => {
    if (userRole && userRole !== 'director') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (data) {
      const now = new Date();
      let start: Date, end: Date;
      switch (period) {
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
      }
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      });
    }
  }, [period, data]);

  const handleInformeClick = (title: string, category: string) => {
    setModalTitle(title);
    setModalCategory(category);
    setModalOpen(true);
  };

  const handleReportClick = (reportType: string) => {
    alert(`Отчёт "${reportType}" в разработке.`);
  };

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

  if (error) {
    return (
      <div className="finance-page">
        <div className="empty-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>Ошибка загрузки: {error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Повторить</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="finance-page">
        <div className="empty-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>Нет данных</p>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M ₽';
    if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K ₽';
    return amount + ' ₽';
  };

  return (
    <div className="finance-page">
      {/* Заголовок */}
      <div className="page-header">
        <h1>📊 Финансы</h1>
        <div className="status-badge">
          <i className="fas fa-link"></i>
          <span>● 1С онлайн</span>
        </div>
      </div>

      {/* Единая панель управления: период и переключатель вида */}
      <div className="finance-toolbar">
        <div className="period-filter">
          <button className={`toggle-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Месяц</button>
          <button className={`toggle-btn ${period === 'quarter' ? 'active' : ''}`} onClick={() => setPeriod('quarter')}>Квартал</button>
          <button className={`toggle-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Год</button>
        </div>
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <i className="fas fa-th"></i> Отчёты
          </button>
          <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <i className="fas fa-list"></i> Операции
          </button>
        </div>
      </div>

      {/* Селектор категорий информеров */}
      <div className="informer-category-selector">
        <button className={`toggle-btn ${informerCategory === 'key' ? 'active' : ''}`} onClick={() => setInformerCategory('key')}>Ключевые</button>
        <button className={`toggle-btn ${informerCategory === 'taxes' ? 'active' : ''}`} onClick={() => setInformerCategory('taxes')}>Налоги</button>
        <button className={`toggle-btn ${informerCategory === 'overhead' ? 'active' : ''}`} onClick={() => setInformerCategory('overhead')}>ОХР</button>
        <button className={`toggle-btn ${informerCategory === 'staff' ? 'active' : ''}`} onClick={() => setInformerCategory('staff')}>Сотрудники</button>
        <button className={`toggle-btn ${informerCategory === 'all' ? 'active' : ''}`} onClick={() => setInformerCategory('all')}>Все</button>
      </div>

      {/* Информеры (как раньше, но с компактными кнопками) */}
      {/* Код информеров идентичен предыдущей версии, только кнопки "детали" не менялись */}
      {/* ... (вставьте сюда блоки информеров из предыдущего ответа) ... */}

      {viewMode === 'grid' && (
        <>
          <div className="reports-grid">
            <div className="report-card clickable" onClick={() => handleReportClick('ОПиУ')}>
              <div className="report-header">
                <span className="report-title">Отчёт о прибылях и убытках</span>
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="report-details">Детализация доходов и расходов</div>
            </div>
            <div className="report-card clickable" onClick={() => handleReportClick('ДДС')}>
              <div className="report-header">
                <span className="report-title">Движение денежных средств</span>
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="report-details">Поступления и списания по месяцам</div>
            </div>
            <div className="report-card clickable" onClick={() => handleReportClick('Налоги')}>
              <div className="report-header">
                <span className="report-title">Налоговая нагрузка</span>
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="report-details">Сводка по всем налогам</div>
            </div>
          </div>

          <div className="section-title"><i className="fas fa-tasks"></i> План/факт по проектам</div>
          <div className="reports-grid">
            {data.projectsPlanFact.map((p, idx) => (
              <div className="report-card clickable" key={idx} onClick={() => navigate(`/projects?id=${p.name.split('(')[1]?.replace(')', '') || '0001'}`)}>
                <div className="report-header">
                  <span>{p.name}</span>
                  <span>{formatAmount(p.fact)} / {formatAmount(p.plan)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progress}%` }}></div>
                </div>
                <div className="report-details">
                  <span>План: {formatAmount(p.plan)}</span>
                  <span>Факт: {formatAmount(p.fact)}</span>
                  <span>Маржа: {p.margin}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.amount.toLocaleString()} ₽</td>
                  <td>
                    <span className={`badge ${t.status === 'Проведено' ? 'success' : t.status === 'В обработке' ? 'warning' : 'danger'}`}>
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

      <div className="integration-block">
        <div className="integration-text">
          <h4><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> Интеграция с 1С</h4>
          <p>Данные автоматически загружаются из 1С через защищённое подключение (OData/REST). Синхронизация происходит по расписанию или вручную. Все финансовые операции, справочники и остатки обновляются в реальном времени.</p>
        </div>
        <button className="btn-sync" onClick={syncWith1C}>
          <i className="fas fa-sync-alt"></i> Синхронизировать
        </button>
        <div className="sync-info">
          <i className="fas fa-database"></i> Последняя синхронизация: {data.lastSync}
        </div>
      </div>

      <FinanceDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        category={modalCategory}
        dateRange={dateRange}
      />
    </div>
  );
};
