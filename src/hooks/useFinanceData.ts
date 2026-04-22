// src/hooks/useFinanceData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface FinanceKPI {
  revenue: number;
  revenueTrend: number;
  netProfit: number;
  profitTrend: number;
  receivables: number;
  receivablesTrend: number;
  payables: number;
  payablesTrend: number;
}

interface FinanceData {
  kpi: FinanceKPI;
  incoming: number;
  outgoing: number;
  balance: number;
  sales: number;
  advances: number;
  equipment: number;
  salary: number;
  rent: number;
  projectsPlanFact: Array<{
    name: string;
    plan: number;
    fact: number;
    progress: number;
    margin: number;
  }>;
  transactions: Array<{
    id: number;
    date: string;
    description: string;
    amount: number;
    status: string;
    hasDocument: boolean;
  }>;
  lastSync: string;
}

export const useFinanceData = (period: 'month' | 'quarter' | 'year' = 'month') => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback(() => {
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
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [period]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getDateRange();

      // 1. Агрегатные запросы для сумм (быстро, без загрузки всех строк)
      const [incomeRes, expenseRes, receivablesRes, payablesRes, categoryRes] = await Promise.all([
        supabase.from('finance_1c').select('amount.sum()').eq('type', 'income').gte('date', start).lte('date', end),
        supabase.from('finance_1c').select('amount.sum()').eq('type', 'expense').gte('date', start).lte('date', end),
        supabase.from('finance_1c').select('amount.sum()').eq('type', 'income').eq('status', 'В обработке').gte('date', start).lte('date', end),
        supabase.from('finance_1c').select('amount.sum()').eq('type', 'expense').eq('status', 'В обработке').gte('date', start).lte('date', end),
        supabase.from('finance_1c').select('category, amount.sum()').gte('date', start).lte('date', end).group('category')
      ]);

      const income = incomeRes.data?.[0]?.sum || 0;
      const expense = expenseRes.data?.[0]?.sum || 0;
      const receivables = receivablesRes.data?.[0]?.sum || 0;
      const payables = payablesRes.data?.[0]?.sum || 0;

      // 2. Детализация по категориям
      const categorySums: Record<string, number> = {};
      (categoryRes.data || []).forEach((row: any) => { categorySums[row.category] = row.sum; });

      const sales = categorySums['Поступление от клиента'] || 0;
      const advances = income - sales;
      const equipment = categorySums['Закупка оборудования'] || 0;
      const salary = ['Зарплата', 'Премия', 'Отпускные', 'Больничный'].reduce((sum, cat) => sum + (categorySums[cat] || 0), 0);
      const rent = categorySums['Аренда офиса'] || 0;

      // 3. Последние 50 транзакций
      const { data: transactions } = await supabase
        .from('finance_1c')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .limit(50);

      const latestTransactions = (transactions || []).map(t => ({
        id: t.id,
        date: new Date(t.date).toLocaleDateString('ru-RU'),
        description: t.description,
        amount: t.amount,
        status: t.status,
        hasDocument: t.has_document,
      }));

      // 4. Тренды (упрощённо)
      const revenueTrend = 8.2;
      const profitTrend = 5.4;
      const receivablesTrend = -12;
      const payablesTrend = 3.1;

      // 5. План/факт по проектам (заглушка)
      const projectsPlanFact = [
        { name: 'Офис продаж (0001)', plan: 2800000, fact: 2500000, progress: 89, margin: 22 },
        { name: 'Конференц-зал (0002)', plan: 8700000, fact: 8700000, progress: 100, margin: 31 },
        { name: 'Школа будущего (0003)', plan: 22100000, fact: 15400000, progress: 70, margin: 18 },
      ];

      setData({
        kpi: {
          revenue: income,
          revenueTrend,
          netProfit: income - expense,
          profitTrend,
          receivables,
          receivablesTrend,
          payables,
          payablesTrend,
        },
        incoming: income,
        outgoing: expense,
        balance: income - expense,
        sales,
        advances,
        equipment,
        salary,
        rent,
        projectsPlanFact,
        transactions: latestTransactions,
        lastSync: new Date().toLocaleString('ru-RU'),
      });
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncWith1C = useCallback(async () => {
    alert('Запрос на синхронизацию с 1С. В реальности здесь вызов Edge Function.');
    await loadData();
  }, [loadData]);

  return { data, loading, error, syncWith1C, refetch: loadData };
};
