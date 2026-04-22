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
  overhead: {
    transport: number;
    internet: number;
    stationery: number;
    other: number;
  };
  staff: {
    salary: number;
    bonus: number;
    vacation: number;
    sickLeave: number;
  };
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

      // 1. Транзакции из 1С
      const { data: transactions, error: txError } = await supabase
        .from('finance_1c')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      if (txError) throw txError;
      const txList = transactions || [];

      // 2. Выплаты сотрудникам
      const { data: salaryPayments, error: spError } = await supabase
        .from('salary_payments')
        .select('amount, type')
        .gte('date', start)
        .lte('date', end);

      if (spError) throw spError;
      const payments = salaryPayments || [];

      // 3. Агрегация по категориям
      let income = 0, expense = 0, receivables = 0, payables = 0;
      const catSums: Record<string, number> = {};

      txList.forEach(t => {
        const cat = t.category;
        catSums[cat] = (catSums[cat] || 0) + t.amount;
        if (t.type === 'income') {
          income += t.amount;
          if (t.status === 'В обработке') receivables += t.amount;
        } else {
          expense += t.amount;
          if (t.status === 'В обработке') payables += t.amount;
        }
      });

      // Налоги
      const nds = catSums['НДС'] || 0;
      const profitTax = catSums['Налог на прибыль'] || 0;
      const insuranceContributions = catSums['Страховые взносы'] || 0;
      const totalTaxes = nds + profitTax + insuranceContributions;

      // Кредиты
      const creditBody = catSums['Погашение кредита (тело)'] || 0;
      const creditInterest = catSums['Проценты по кредиту'] || 0;
      const totalCredits = creditBody + creditInterest;

      // Продажи и авансы
      const sales = catSums['Поступление от клиента'] || 0;
      const advances = income - sales;

      // Оборудование
      const equipment = catSums['Закупка оборудования'] || 0;

      // Аренда
      const rent = catSums['Аренда офиса'] || 0;

      // ОХР
      const transport = catSums['Транспортные расходы'] || 0;
      const internet = catSums['Интернет/Связь'] || 0;
      const stationery = catSums['Канцтовары'] || 0;
      const other = catSums['Прочее'] || 0;

      // Зарплата и связанные выплаты
      let staffSalary = 0, staffBonus = 0, staffVacation = 0, staffSickLeave = 0;
      payments.forEach(p => {
        switch (p.type) {
          case 'salary': staffSalary += p.amount; break;
          case 'bonus': staffBonus += p.amount; break;
          case 'vacation': staffVacation += p.amount; break;
          case 'sick_leave': staffSickLeave += p.amount; break;
        }
      });
      const totalSalary = staffSalary + staffBonus + staffVacation + staffSickLeave;

      // Тренды (заглушки)
      const revenueTrend = 8.2;
      const profitTrend = 5.4;
      const receivablesTrend = -12;
      const payablesTrend = 3.1;

      // План/факт по проектам
      const projectsPlanFact = [
        { name: 'Офис продаж (0001)', plan: 2800000, fact: 2500000, progress: 89, margin: 22 },
        { name: 'Конференц-зал (0002)', plan: 8700000, fact: 8700000, progress: 100, margin: 31 },
        { name: 'Школа будущего (0003)', plan: 22100000, fact: 15400000, progress: 70, margin: 18 },
      ];

      // Последние 50 транзакций
      const latestTransactions = [...txList]
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
        overhead: { transport, internet, stationery, other },
        staff: {
          salary: staffSalary,
          bonus: staffBonus,
          vacation: staffVacation,
          sickLeave: staffSickLeave,
        },
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
