// src/pages/FinanceOverheadPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const FinanceOverheadPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) return <div className="page-message">Загрузка...</div>;
  if (!data) return <div className="page-message">Нет данных</div>;

  const pieData = [
    { name: 'Аренда', value: data.overhead.reduce((s, o) => s + o.rent, 0) },
    { name: 'Транспорт', value: data.overhead.reduce((s, o) => s + o.transport, 0) },
    { name: 'Интернет', value: data.overhead.reduce((s, o) => s + o.internet, 0) },
    { name: 'Канцтовары', value: data.overhead.reduce((s, o) => s + o.stationery, 0) },
    { name: 'Прочее', value: data.overhead.reduce((s, o) => s + o.other, 0) },
  ];

  const monthlyData = data.overhead.map(o => ({
    month: o.month,
    Аренда: o.rent,
    Транспорт: o.transport,
    Интернет: o.internet,
    Канцтовары: o.stationery,
    Прочее: o.other,
  }));

  return (
    <div className="finance-analytics-page">
      <button className="btn-secondary" onClick={() => navigate('/finance')}>
        <i className="fas fa-arrow-left"></i> Назад к финансам
      </button>
      <h2 style={{ marginTop: 16 }}>Общехозяйственные расходы</h2>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Ежемесячные расходы</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Аренда" stackId="a" fill="#06b6d4" />
            <Bar dataKey="Транспорт" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Интернет" stackId="a" fill="#10b981" />
            <Bar dataKey="Канцтовары" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Прочее" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Структура ОХР</div>
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
            🏢 Основную долю занимает <strong>аренда</strong>. Расходы на транспорт снижаются, канцтовары немного выросли к концу года.
          </div>
        </div>
      </div>
    </div>
  );
};
