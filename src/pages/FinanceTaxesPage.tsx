// src/pages/FinanceTaxesPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#e2e8f0'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()} ₽
        </p>
      ))}
    </div>
  );
};

export const FinanceTaxesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) return <div className="page-message">Загрузка...</div>;
  if (!data) return <div className="page-message">Нет данных</div>;

  const pieData = [
    { name: 'НДС', value: data.taxes.reduce((s, t) => s + t.nds, 0) },
    { name: 'Налог на прибыль', value: data.taxes.reduce((s, t) => s + t.profitTax, 0) },
    { name: 'Страховые взносы', value: data.taxes.reduce((s, t) => s + t.insurance, 0) },
  ];

  return (
    <div className="finance-analytics-page">
      <button className="btn-secondary" onClick={() => navigate('/finance')}>
        <i className="fas fa-arrow-left"></i> Назад к финансам
      </button>
      <h2 style={{ marginTop: 16 }}>Налоги</h2>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Помесячная динамика налогов</div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.taxes}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="nds" name="НДС" stroke="#8b5cf6" fill="rgba(139,92,246,0.15)" strokeWidth={2} />
            <Area type="monotone" dataKey="profitTax" name="Налог на прибыль" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
            <Area type="monotone" dataKey="insurance" name="Страховые взносы" stroke="#f59e0b" fill="rgba(245,158,11,0.15)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Структура налогов</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => `${val.toLocaleString()} ₽`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Аналитика</div>
          <div className="chart-insight">
            📊 Основной налог – <strong>НДС</strong>, его доля составляет {((pieData[0].value / (pieData.reduce((s,i)=>s+i.value,1))*100) || 0).toFixed(1)}%.<br />
            Общая налоговая нагрузка стабильна в течение года.
          </div>
        </div>
      </div>
    </div>
  );
};
