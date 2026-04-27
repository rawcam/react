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

const getRevenueInsight = (data: { value: number }[]) => {
  if (data.length < 2) return 'Недостаточно данных.';
  const last = data[data.length - 1].value;
  const prev = data[data.length - 2].value;
  const change = last - prev;
  const dir = change >= 0 ? 'выросла' : 'снизилась';
  return `📊 За последний месяц выручка ${dir} на ${Math.abs(change).toLocaleString()} ₽.`;
};

const getReceivablesInsight = (data: { value: number }[]) => {
  if (data.length < 2) return '';
  const last = data[data.length - 1].value;
  const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
  return last > avg
    ? `🔴 Дебиторка выше среднего (${avg.toLocaleString()} ₽). Рекомендуется усилить контроль.`
    : `🟢 Дебиторка ниже среднего. Платёжная дисциплина на хорошем уровне.`;
};

const getPayablesInsight = (data: { value: number }[]) => {
  if (data.length < 2) return '';
  const last = data[data.length - 1].value;
  const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
  return last > avg
    ? `🔴 Кредиторка выросла выше среднего. Проверьте сроки оплат.`
    : `🟢 Кредиторка в норме, просрочек нет.`;
};

export const FinanceOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) return <div className="page-message">Загрузка аналитики...</div>;
  if (!data || data.revenue.length === 0) {
    return (
      <div className="page-message">
        <p>Нет данных. Обновите материализованное представление.</p>
        <button className="btn-secondary" onClick={() => navigate('/finance')}>
          <i className="fas fa-arrow-left"></i> Назад
        </button>
      </div>
    );
  }

  const combined = data.revenue.map((r, i) => ({
    month: r.month,
    revenue: r.value,
    profit: data.profit[i]?.value || 0,
  }));

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
          <AreaChart data={combined}>
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
        <div className="chart-insight">{getRevenueInsight(data.revenue)}</div>
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
          <div className="chart-insight">{getReceivablesInsight(data.receivables)}</div>
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
          <div className="chart-insight">{getPayablesInsight(data.payables)}</div>
        </div>
      </div>
    </div>
  );
};
