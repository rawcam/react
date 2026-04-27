// src/pages/FinanceStatisticsPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics';
import './FinanceAnalytics.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatRub = (value: number) => `${(value / 1_000_000).toFixed(1)} млн ₽`;

export const FinanceStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useFinanceAnalytics();

  if (loading) return <div className="page-message">Загрузка...</div>;
  if (!data) return <div className="page-message">Нет данных</div>;

  // Агрегируем суммы по категориям для круговых диаграмм
  const totalRevenue = data.revenue.reduce((s, r) => s + r.value, 0);
  const totalProfit = data.profit.reduce((s, p) => s + p.value, 0);
  const totalTaxes = data.taxes.reduce((s, t) => s + t.nds + t.profitTax + t.insurance, 0);
  const totalOverhead = data.overhead.reduce((s, o) => s + o.rent + o.transport + o.internet + o.stationery + o.other, 0);
  const totalStaff = data.staff.reduce((s, st) => s + st.salary + st.bonus + st.vacation + st.sickLeave, 0);

  return (
    <div className="finance-analytics-page">
      <button className="btn-secondary" onClick={() => navigate('/finance')}>
        <i className="fas fa-arrow-left"></i> Назад к финансам
      </button>
      <h2 style={{ marginTop: 16 }}>Общая статистика</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="chart-card">
          <div className="chart-title">Выручка и прибыль</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[{ name: 'Выручка', value: totalRevenue }, { name: 'Прибыль', value: totalProfit }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" tickFormatter={formatRub} fontSize={12} />
              <Tooltip formatter={(val: number) => val.toLocaleString() + ' ₽'} />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Распределение расходов</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Налоги', value: totalTaxes },
                  { name: 'ОХР', value: totalOverhead },
                  { name: 'Персонал', value: totalStaff },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
              >
                {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(val: number) => val.toLocaleString() + ' ₽'} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
