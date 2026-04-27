// src/pages/FinanceStaffPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const COLORS = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444'];

export const FinanceStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) return <div className="page-message">Загрузка...</div>;
  if (!data) return <div className="page-message">Нет данных</div>;

  const pieData = [
    { name: 'Зарплата', value: data.staff.reduce((s, st) => s + st.salary, 0) },
    { name: 'Премии', value: data.staff.reduce((s, st) => s + st.bonus, 0) },
    { name: 'Отпускные', value: data.staff.reduce((s, st) => s + st.vacation, 0) },
    { name: 'Больничные', value: data.staff.reduce((s, st) => s + st.sickLeave, 0) },
  ];

  const monthly = data.staff.map(s => ({
    month: s.month,
    Зарплата: s.salary,
    Премии: s.bonus,
    Отпускные: s.vacation,
    Больничные: s.sickLeave,
  }));

  return (
    <div className="finance-analytics-page">
      <button className="btn-secondary" onClick={() => navigate('/finance')}>
        <i className="fas fa-arrow-left"></i> Назад к финансам
      </button>
      <h2 style={{ marginTop: 16 }}>Расходы на персонал</h2>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Ежемесячные затраты на персонал</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Зарплата" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="Премии" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Отпускные" stackId="a" fill="#06b6d4" />
            <Bar dataKey="Больничные" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Структура ФОТ</div>
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
            💰 Основной фонд – <strong>зарплата</strong>. Премии выплачиваются поквартально, отпускные возрастают летом.
          </div>
        </div>
      </div>
    </div>
  );
};
