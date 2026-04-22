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
  totalTaxes: number;
  nds: number;
  profitTax: number;
  insuranceContributions: number;
  totalSalary: number;
  totalCredits: number;
  creditBody: number;
  creditInterest: number;
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
  // Новые агрегаты по сотрудникам
  staffSalary: number;
  staffBonus: number;
  staffVacation: number;
  staffSickLeave: number;
  // Общехозяйственные расходы
  overheadTransport: number;
  overheadInternet: number;
  overheadStationery: number;
  overheadOther: number;
  projectsPlanFact: Array<{
    id: string;
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

      // 1. Финансовые транзакции (finance_1c)
      const { data: transactions, error: txError } = await supabase
        .from('finance_1c')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      if (txError) throw txError;

      const txs = transactions || [];
      let income = 0, expense = 0, receivables = 0, payables = 0;
      const categorySums: Record<string, number> = {};

      txs.forEach(t => {
        const cat = t.category;
        categorySums[cat] = (categorySums[cat] || 0) + t.amount;
        if (t.type === 'income') {
          income += t.amount;
          if (t.status === 'В обработке') receivables += t.amount;
        } else {
          expense += t.amount;
          if (t.status === 'В обработке') payables += t.amount;
        }
      });

      // Налоги
      const nds = categorySums['НДС'] || 0;
      const profitTax = categorySums['Налог на прибыль'] || 0;
      const insuranceContributions = categorySums['Страховые взносы'] || 0;
      const totalTaxes = nds + profitTax + insuranceContributions;

      // Кредиты
      const creditBody = categorySums['Погашение кредита (тело)'] || 0;
      const creditInterest = categorySums['Проценты по кредиту'] || 0;
      const totalCredits = creditBody + creditInterest;

      const sales = categorySums['Поступление от клиента'] || 0;
      const advances = income - sales;
      const equipment = categorySums['Закупка оборудования'] || 0;
      const rent = categorySums['Аренда офиса'] || 0;

      // 2. Данные по сотрудникам из salary_payments
      const { data: payments, error: payError } = await supabase
        .from('salary_payments')
        .select('amount, type')
        .gte('date', start)
        .lte('date', end);

      if (payError) throw payError;

      let staffSalary = 0, staffBonus = 0, staffVacation = 0, staffSickLeave = 0;
      payments?.forEach(p => {
        switch (p.type) {
          case 'salary': staffSalary += p.amount; break;
          case 'bonus': staffBonus += p.amount; break;
          case 'vacation': staffVacation += p.amount; break;
          case 'sick_leave': staffSickLeave += p.amount; break;
        }
      });
      const totalSalary = staffSalary + staffBonus + staffVacation + staffSickLeave;

      // 3. Общехозяйственные расходы (пока из категорий finance_1c)
      const overheadTransport = categorySums['Транспортные расходы'] || 0;
      const overheadInternet = categorySums['Интернет/Связь'] || 0;
      const overheadStationery = categorySums['Канцтовары'] || 0;
      const overheadOther = categorySums['Прочее'] || 0;

      // 4. Транзакции для таблицы
      const latestTransactions = [...txs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50)
        .map(t => ({
          id: t.id,
          date: new Date(t.date).toLocaleDateString('ru-RU'),
          description: t.description,
          amount: t.amount,
          status: t.status,
          hasDocument: t.has_document,
        }));

      const revenueTrend = 8.2;
      const profitTrend = 5.4;
      const receivablesTrend = -12;
      const payablesTrend = 3.1;

      // Заглушки план/факт (пока без изменений, но добавим id)
      const projectsPlanFact = [
        { id: '1776752387056', name: 'Офис продаж (0001)', plan: 2800000, fact: 2500000, progress: 89, margin: 22 },
        { id: '1776776832084', name: 'Конференц-зал (0002)', plan: 8700000, fact: 8700000, progress: 100, margin: 31 },
        { id: '1776753172095', name: 'Школа будущего (0003)', plan: 22100000, fact: 15400000, progress: 70, margin: 18 },
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
          totalTaxes,
          nds,
          profitTax,
          insuranceContributions,
          totalSalary,
          totalCredits,
          creditBody,
          creditInterest,
        },
        incoming: income,
        outgoing: expense,
        balance: income - expense,
        sales,
        advances,
        equipment,
        salary: totalSalary,
        rent,
        staffSalary,
        staffBonus,
        staffVacation,
        staffSickLeave,
        overheadTransport,
        overheadInternet,
        overheadStationery,
        overheadOther,
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

  const getDetailedTransactions = useCallback(async (category: string) => {
    const { start, end } = getDateRange();
    const { data, error } = await supabase
      .from('finance_1c')
      .select('*')
      .eq('category', category)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }, [getDateRange]);

  return { data, loading, error, syncWith1C, refetch: loadData, getDetailedTransactions };
};
