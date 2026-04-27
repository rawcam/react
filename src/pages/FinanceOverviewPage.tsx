// src/pages/FinanceOverviewPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const formatMillions = (value: number) => `${(value / 1_000_000).toFixed(1)} млн`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color, margin: 0 }}>
          {entry.name}: {(entry.value / 1_000_000).toFixed(2)} млн ₽
        </p>
      ))}
    </div>
  );
};

export const FinanceOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) {
    return <div className="page-message">Загрузка аналитики...</div>;
  }

  if (!data) {
    return <div className="page-message">Нет данных для отображения</div>;
  }

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
          <AreaChart data={data.revenue.map((r, i) => ({
            ...r,
            profit: data.profit[i]?.value || 0,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={formatMillions} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" name="Выручка" stroke="#2563eb" fill="rgba(37,99,235,0.15)" />
            <Area type="monotone" dataKey="profit" name="Прибыль" stroke="#10b981" fill="rgba(16,185,129,0.15)" />
          </AreaChart>
        </ResponsiveContainer>
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
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
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
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
