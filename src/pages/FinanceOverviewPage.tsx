// src/pages/FinanceOverviewPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const formatMillions = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return `${(value / 1_000).toFixed(0)}K`;
};

/* Кастомный тултип в стиле демо */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString('ru-RU')} ₽
        </p>
      ))}
    </div>
  );
};

/* Простая текстовая аналитика – в реальности будет генерироваться на основе данных */
const getInsight = (revenueData: { value: number }[], profitData: { value: number }[]) => {
  if (revenueData.length < 2) return 'Недостаточно данных для анализа.';
  const lastRev = revenueData[revenueData.length - 1].value;
  const prevRev = revenueData[revenueData.length - 2].value;
  const change = lastRev - prevRev;
  const percent = prevRev ? ((change / prevRev) * 100).toFixed(1) : '0';
  const direction = change >= 0 ? 'выросла' : 'снизилась';
  return `📊 За последний месяц выручка ${direction} на ${Math.abs(Number(percent))}% по сравнению с предыдущим. Общая прибыль демонстрирует стабильную динамику.`;
};

export const FinanceOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) {
    return <div className="page-message">Загрузка аналитики...</div>;
  }

  if (!data || data.revenue.length === 0) {
    return (
      <div className="page-message">
        <p>Нет данных для отображения. Обновите материализованное представление.</p>
        <button className="btn-secondary" onClick={() => navigate('/finance')}>
          <i className="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    );
  }

  // Готовим объединённые данные для графика
  const combinedData = data.revenue.map((r, i) => ({
    month: r.month,
    revenue: r.value,
    profit: data.profit[i]?.value || 0,
  }));

  const insight = getInsight(data.revenue, data.profit);

  return (
    <div className="finance-analytics-page">
      <button className="btn-secondary" onClick={() => navigate('/finance')}>
        <i className="fas fa-arrow-left"></i> Назад к финансам
      </button>
      <h2 style={{ marginTop: 16 }}>Финансовый обзор</h2>

      {/* Выручка и прибыль */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Выручка и чистая прибыль</div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={combinedData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={formatMillions} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Выручка" stroke="var(--accent)" fill="url(#colorRevenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="profit" name="Прибыль" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-insight">{insight}</div>
      </div>

      {/* Дебиторка и кредиторка */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Дебиторская задолженность</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.receivables}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" tickFormatter={formatMillions} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" name="Дебиторка" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Кредиторская задолженность</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.payables}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" tickFormatter={formatMillions} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" name="Кредиторка" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
