// src/pages/FinancePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
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

      {/* Фильтр периода */}
      <div className="period-filter">
        <button className={`toggle-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Месяц</button>
        <button className={`toggle-btn ${period === 'quarter' ? 'active' : ''}`} onClick={() => setPeriod('quarter')}>Квартал</button>
        <button className={`toggle-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Год</button>
      </div>

      {/* Селектор категорий информеров */}
      <div className="informer-category-selector">
        <button className={`toggle-btn ${informerCategory === 'key' ? 'active' : ''}`} onClick={() => setInformerCategory('key')}>Ключевые</button>
        <button className={`toggle-btn ${informerCategory === 'taxes' ? 'active' : ''}`} onClick={() => setInformerCategory('taxes')}>Налоги</button>
        <button className={`toggle-btn ${informerCategory === 'overhead' ? 'active' : ''}`} onClick={() => setInformerCategory('overhead')}>ОХР</button>
        <button className={`toggle-btn ${informerCategory === 'staff' ? 'active' : ''}`} onClick={() => setInformerCategory('staff')}>Сотрудники</button>
        <button className={`toggle-btn ${informerCategory === 'all' ? 'active' : ''}`} onClick={() => setInformerCategory('all')}>Все</button>
      </div>

      {/* Информеры в зависимости от выбранной категории */}
      {(informerCategory === 'key' || informerCategory === 'all') && (
        <>
          <div className="section-title"><i className="fas fa-chart-pie"></i> Ключевые показатели</div>
          <div className="informers-row">
            <div className="informer clickable" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleInformeClick('Выручка', 'Поступление от клиента')}>
              <div className="label">Выручка</div>
              <div className="value">{formatAmount(data.kpi.revenue)}</div>
              <div className={`trend ${data.kpi.revenueTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                <i className={`fas fa-arrow-${data.kpi.revenueTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data.kpi.revenueTrend)}%
              </div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#10b981' }} onClick={() => handleInformeClick('Чистая прибыль', '')}>
              <div className="label">Чистая прибыль</div>
              <div className="value">{formatAmount(data.kpi.netProfit)}</div>
              <div className={`trend ${data.kpi.profitTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                <i className={`fas fa-arrow-${data.kpi.profitTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data.kpi.profitTrend)}%
              </div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#f59e0b' }} onClick={() => handleInformeClick('Дебиторская задолженность', '')}>
              <div className="label">Дебиторка</div>
              <div className="value">{formatAmount(data.kpi.receivables)}</div>
              <div className={`trend ${data.kpi.receivablesTrend < 0 ? 'trend-down' : 'trend-up'}`}>
                <i className={`fas fa-arrow-${data.kpi.receivablesTrend < 0 ? 'down' : 'up'}`}></i> {Math.abs(data.kpi.receivablesTrend)}%
              </div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#ef4444' }} onClick={() => handleInformeClick('Кредиторская задолженность', '')}>
              <div className="label">Кредиторка</div>
              <div className="value">{formatAmount(data.kpi.payables)}</div>
              <div className={`trend ${data.kpi.payablesTrend > 0 ? 'trend-up' : 'trend-down'}`}>
                <i className={`fas fa-arrow-${data.kpi.payablesTrend > 0 ? 'up' : 'down'}`}></i> {Math.abs(data.kpi.payablesTrend)}%
              </div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#8b5cf6' }} onClick={() => handleInformeClick('Рентабельность', '')}>
              <div className="label">Рентабельность</div>
              <div className="value">{data.kpi.revenue > 0 ? ((data.kpi.netProfit / data.kpi.revenue) * 100).toFixed(1) : '0.0'}%</div>
            </div>
          </div>
        </>
      )}

      {(informerCategory === 'taxes' || informerCategory === 'all') && (
        <>
          <div className="section-title"><i className="fas fa-landmark"></i> Налоги</div>
          <div className="informers-row">
            <div className="informer clickable" style={{ borderLeftColor: '#8b5cf6' }} onClick={() => handleInformeClick('Все налоги', 'НДС')}>
              <div className="label">Всего налогов</div>
              <div className="value">{formatAmount(data.kpi.totalTaxes)}</div>
              <div className="sub">НДС: {formatAmount(data.kpi.nds)} | Прибыль: {formatAmount(data.kpi.profitTax)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#a78bfa' }} onClick={() => handleInformeClick('НДС', 'НДС')}>
              <div className="label">НДС</div>
              <div className="value">{formatAmount(data.kpi.nds)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#c084fc' }} onClick={() => handleInformeClick('Налог на прибыль', 'Налог на прибыль')}>
              <div className="label">Налог на прибыль</div>
              <div className="value">{formatAmount(data.kpi.profitTax)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#e879f9' }} onClick={() => handleInformeClick('Страховые взносы', 'Страховые взносы')}>
              <div className="label">Страховые взносы</div>
              <div className="value">{formatAmount(data.kpi.insuranceContributions)}</div>
            </div>
          </div>
        </>
      )}

      {(informerCategory === 'overhead' || informerCategory === 'all') && (
        <>
          <div className="section-title"><i className="fas fa-building"></i> Общехозяйственные расходы</div>
          <div className="informers-row">
            <div className="informer clickable" style={{ borderLeftColor: '#06b6d4' }} onClick={() => handleInformeClick('Аренда', 'Аренда офиса')}>
              <div className="label">Аренда</div>
              <div className="value">{formatAmount(data.rent)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleInformeClick('Транспорт', 'Транспортные расходы')}>
              <div className="label">Транспорт</div>
              <div className="value">{formatAmount(categorySums['Транспортные расходы'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#10b981' }} onClick={() => handleInformeClick('Связь/интернет', 'Интернет/Связь')}>
              <div className="label">Связь/интернет</div>
              <div className="value">{formatAmount(categorySums['Интернет/Связь'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#f59e0b' }} onClick={() => handleInformeClick('Канцтовары', 'Канцтовары')}>
              <div className="label">Канцтовары</div>
              <div className="value">{formatAmount(categorySums['Канцтовары'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#ef4444' }} onClick={() => handleInformeClick('Прочее', 'Прочее')}>
              <div className="label">Прочее</div>
              <div className="value">{formatAmount(categorySums['Прочее'] || 0)}</div>
            </div>
          </div>
        </>
      )}

      {(informerCategory === 'staff' || informerCategory === 'all') && (
        <>
          <div className="section-title"><i className="fas fa-users"></i> Сотрудники</div>
          <div className="informers-row">
            <div className="informer clickable" style={{ borderLeftColor: '#ec4899' }} onClick={() => handleInformeClick('ФОТ', 'Зарплата')}>
              <div className="label">ФОТ (всего)</div>
              <div className="value">{formatAmount(data.kpi.totalSalary)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#f472b6' }} onClick={() => handleInformeClick('Зарплата', 'Зарплата')}>
              <div className="label">Зарплата</div>
              <div className="value">{formatAmount(categorySums['Зарплата'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#fb923c' }} onClick={() => handleInformeClick('Премии', 'Премия')}>
              <div className="label">Премии</div>
              <div className="value">{formatAmount(categorySums['Премия'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#fbbf24' }} onClick={() => handleInformeClick('Отпускные', 'Отпускные')}>
              <div className="label">Отпускные</div>
              <div className="value">{formatAmount(categorySums['Отпускные'] || 0)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#34d399' }} onClick={() => handleInformeClick('Больничные', 'Больничный')}>
              <div className="label">Больничные</div>
              <div className="value">{formatAmount(categorySums['Больничный'] || 0)}</div>
            </div>
          </div>
        </>
      )}

      {/* Отчёты (сетка) */}
      <div className="view-toggle">
        <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
          <i className="fas fa-th"></i> Отчёты
        </button>
        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
          <i className="fas fa-list"></i> Операции
        </button>
      </div>

      {viewMode === 'grid' && (
        <>
          <div className="reports-grid">
            <div className="report-card clickable" onClick={() => navigate('/reports/pnl')}>
              <div className="report-header">
                <span className="report-title">Отчёт о прибылях и убытках</span>
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="report-details">Детализация доходов и расходов</div>
            </div>
            <div className="report-card clickable" onClick={() => navigate('/reports/cashflow')}>
              <div className="report-header">
                <span className="report-title">Движение денежных средств</span>
                <i className="fas fa-chevron-right"></i>
              </div>
              <div className="report-details">Поступления и списания по месяцам</div>
            </div>
            <div className="report-card clickable" onClick={() => navigate('/reports/taxes')}>
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
              <div className="report-card clickable" key={idx} onClick={() => navigate(`/projects?id=${p.id}`)}>
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

      {/* Блок интеграции 1С */}
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
