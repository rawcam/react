// src/pages/FinancePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { useFinanceData } from '../hooks/useFinanceData';
import { FinanceDetailModal } from '../components/ui/FinanceDetailModal';
import './FinancePage.css';

type InformerCategory = 'all' | 'key' | 'taxes' | 'overhead' | 'staff';
type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

export const FinancePage: React.FC = () => {
  const navigate = useNavigate();
  const userRole = useSelector((state: RootState) => state.auth.role);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const { data, loading, error, syncWith1C } = useFinanceData(
    periodType === 'custom' ? 'month' : periodType,
    periodType === 'custom' ? customStart : undefined,
    periodType === 'custom' ? customEnd : undefined
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [informerCategory, setInformerCategory] = useState<InformerCategory>('key');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userRole && userRole !== 'director') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (data) {
      setDateRange({
        start: customStart || (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().split('T')[0]; })(),
        end: customEnd || new Date().toISOString().split('T')[0]
      });
    }
  }, [data, customStart, customEnd]);

  const handleInformeClick = (title: string, category: string) => {
    setModalTitle(title);
    setModalCategory(category);
    setModalOpen(true);
  };

  const handleReportClick = (reportType: string) => {
    alert(`Отчёт "${reportType}" в разработке.`);
  };

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.transactions;
    const q = searchQuery.toLowerCase();
    return data.transactions.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.date.includes(q) ||
      t.amount.toString().includes(q)
    );
  }, [data, searchQuery]);

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
      {/* Статус 1С — маленькая иконка справа */}
      <div className="finance-header">
        <div className="status-badge-small">
          <i className="fas fa-link"></i>
          <span>● 1С онлайн</span>
        </div>
      </div>

      {/* Тулбар с выпадающим списком периода */}
      <div className="finance-toolbar">
        <div className="toolbar-left">
          <div className="filter-group">
            <label>Период</label>
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>
              <option value="month">Месяц</option>
              <option value="quarter">Квартал</option>
              <option value="year">Год</option>
              <option value="custom">Произвольный</option>
            </select>
          </div>
          {periodType === 'custom' && (
            <div className="custom-date-range">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span>—</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Строка с категориями информеров и переключателем вида (справа) */}
      <div className="finance-control-row">
        <div className="informer-category-selector">
          <button className={`toggle-btn ${informerCategory === 'key' ? 'active' : ''}`} onClick={() => setInformerCategory('key')}>Ключевые</button>
          <button className={`toggle-btn ${informerCategory === 'taxes' ? 'active' : ''}`} onClick={() => setInformerCategory('taxes')}>Налоги</button>
          <button className={`toggle-btn ${informerCategory === 'overhead' ? 'active' : ''}`} onClick={() => setInformerCategory('overhead')}>ОХР</button>
          <button className={`toggle-btn ${informerCategory === 'staff' ? 'active' : ''}`} onClick={() => setInformerCategory('staff')}>Сотрудники</button>
          <button className={`toggle-btn ${informerCategory === 'all' ? 'active' : ''}`} onClick={() => setInformerCategory('all')}>Все</button>
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <i className="fas fa-th"></i> Отчёты
          </button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <i className="fas fa-list"></i> Операции
          </button>
        </div>
      </div>

      {/* Информеры */}
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
              <div className="value">{formatAmount(data.overhead.transport)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#10b981' }} onClick={() => handleInformeClick('Связь/интернет', 'Интернет/Связь')}>
              <div className="label">Связь/интернет</div>
              <div className="value">{formatAmount(data.overhead.internet)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#f59e0b' }} onClick={() => handleInformeClick('Канцтовары', 'Канцтовары')}>
              <div className="label">Канцтовары</div>
              <div className="value">{formatAmount(data.overhead.stationery)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#ef4444' }} onClick={() => handleInformeClick('Прочее', 'Прочее')}>
              <div className="label">Прочее</div>
              <div className="value">{formatAmount(data.overhead.other)}</div>
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
              <div className="value">{formatAmount(data.staff.salary)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#fb923c' }} onClick={() => handleInformeClick('Премии', 'Премия')}>
              <div className="label">Премии</div>
              <div className="value">{formatAmount(data.staff.bonus)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#fbbf24' }} onClick={() => handleInformeClick('Отпускные', 'Отпускные')}>
              <div className="label">Отпускные</div>
              <div className="value">{formatAmount(data.staff.vacation)}</div>
            </div>
            <div className="informer clickable" style={{ borderLeftColor: '#34d399' }} onClick={() => handleInformeClick('Больничные', 'Больничный')}>
              <div className="label">Больничные</div>
              <div className="value">{formatAmount(data.staff.sickLeave)}</div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'grid' && (
        <>
          <div className="reports-grid">
            <div className="report-card clickable" onClick={() => handleReportClick('ОПиУ')}>
              <div className="report-header"><span className="report-title">Отчёт о прибылях и убытках</span><i className="fas fa-chevron-right"></i></div>
              <div className="report-details">Детализация доходов и расходов</div>
            </div>
            <div className="report-card clickable" onClick={() => handleReportClick('ДДС')}>
              <div className="report-header"><span className="report-title">Движение денежных средств</span><i className="fas fa-chevron-right"></i></div>
              <div className="report-details">Поступления и списания по месяцам</div>
            </div>
            <div className="report-card clickable" onClick={() => handleReportClick('Налоги')}>
              <div className="report-header"><span className="report-title">Налоговая нагрузка</span><i className="fas fa-chevron-right"></i></div>
              <div className="report-details">Сводка по всем налогам</div>
            </div>
          </div>

          <div className="section-title"><i className="fas fa-tasks"></i> План/факт по проектам</div>
          <div className="reports-grid">
            {data.projectsPlanFact.map((p, idx) => (
              <div className="report-card clickable" key={idx} onClick={() => navigate(`/projects?id=${p.name.split('(')[1]?.replace(')', '') || '0001'}`)}>
                <div className="report-header"><span>{p.name}</span><span>{formatAmount(p.fact)} / {formatAmount(p.plan)}</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress}%` }}></div></div>
                <div className="report-details"><span>План: {formatAmount(p.plan)}</span><span>Факт: {formatAmount(p.fact)}</span><span>Маржа: {p.margin}%</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'list' && (
        <>
          <div className="transactions-search">
            <input
              type="text"
              placeholder="Поиск по описанию, дате или сумме..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
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
                {filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.amount.toLocaleString()} ₽</td>
                    <td><span className={`badge ${t.status === 'Проведено' ? 'success' : t.status === 'В обработке' ? 'warning' : 'danger'}`}>{t.status}</span></td>
                    <td><button className="btn-download" disabled={!t.hasDocument} onClick={() => alert(`Скачать документ для транзакции #${t.id}`)}><i className="fas fa-download"></i> ПП</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="integration-block">
        <div className="integration-text">
          <h4><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> Интеграция с 1С</h4>
          <p>Данные автоматически загружаются из 1С через защищённое подключение (OData/REST). Синхронизация происходит по расписанию или вручную.</p>
        </div>
        <button className="btn-sync" onClick={syncWith1C}><i className="fas fa-sync-alt"></i> Синхронизировать</button>
        <div className="sync-info"><i className="fas fa-database"></i> Последняя синхронизация: {data.lastSync}</div>
      </div>

      <FinanceDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} category={modalCategory} dateRange={dateRange} />
    </div>
  );
};
