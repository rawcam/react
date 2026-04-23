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
            {/* ... информеры без изменений ... */}
          </div>
        </>
      )}
      {/* ... остальные категории информеров без изменений ... */}

      {/* Сетка/список как в предыдущей версии, но уже с правильным позиционированием */}
      {/* ... */}
    </div>
  );
};
