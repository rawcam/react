// src/hooks/useFinanceAnalytics.ts
import { useState, useEffect } from 'react';
import { supabase } from '../App';

export interface MonthlySummary {
  month: string;         // YYYY-MM
  category: string;
  type: 'income' | 'expense';
  total_amount: number;
}

export interface FinanceAnalyticsData {
  revenue: { month: string; value: number }[];
  profit: { month: string; value: number }[];
  receivables: { month: string; value: number }[];
  payables: { month: string; value: number }[];
  taxes: { month: string; nds: number; profitTax: number; insurance: number }[];
  overhead: { month: string; rent: number; transport: number; internet: number; stationery: number; other: number }[];
  staff: { month: string; salary: number; bonus: number; vacation: number; sickLeave: number }[];
}

const cache = new Map<string, FinanceAnalyticsData>();

export function useFinanceAnalytics(year: number = new Date().getFullYear()) {
  const [data, setData] = useState<FinanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `analytics_${year}`;
    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;

        // Загрузка всех агрегатов одним запросом через представление
        const { data: rows, error } = await supabase
          .from('finance_monthly_summary')
          .select('*')
          .gte('month', start)
          .lte('month', end)
          .order('month');

        if (error) throw error;

        const monthlyMap = new Map<string, MonthlySummary[]>();
        (rows || []).forEach(r => {
          const m = r.month.slice(0, 7); // YYYY-MM
          if (!monthlyMap.has(m)) monthlyMap.set(m, []);
          monthlyMap.get(m)!.push(r);
        });

        // Преобразуем в структуру для графиков
        const months = Array.from(monthlyMap.keys()).sort();
        
        const result: FinanceAnalyticsData = {
          revenue: [],
          profit: [],
          receivables: [],
          payables: [],
          taxes: [],
          overhead: [],
          staff: [],
        };

        months.forEach(m => {
          const items = monthlyMap.get(m) || [];
          const byCategory: Record<string, number> = {};
          items.forEach(item => {
            const key = `${item.category}_${item.type}`;
            byCategory[key] = (byCategory[key] || 0) + item.total_amount;
          });

          result.revenue.push({
            month: m,
            value: byCategory['Поступление от клиента_income'] || 0,
          });
          result.profit.push({
            month: m,
            value: (byCategory['Поступление от клиента_income'] || 0) - (Object.entries(byCategory)
              .filter(([k]) => k.endsWith('_expense'))
              .reduce((sum, [, v]) => sum + v, 0)),
          });
          result.receivables.push({
            month: m,
            value: byCategory['Дебиторская задолженность_income'] || 0, // условно
          });
          result.payables.push({
            month: m,
            value: byCategory['Кредиторская задолженность_expense'] || 0,
          });
          result.taxes.push({
            month: m,
            nds: byCategory['НДС_expense'] || 0,
            profitTax: byCategory['Налог на прибыль_expense'] || 0,
            insurance: byCategory['Страховые взносы_expense'] || 0,
          });
          result.overhead.push({
            month: m,
            rent: byCategory['Аренда офиса_expense'] || 0,
            transport: byCategory['Транспортные расходы_expense'] || 0,
            internet: byCategory['Интернет/Связь_expense'] || 0,
            stationery: byCategory['Канцтовары_expense'] || 0,
            other: byCategory['Прочее_expense'] || 0,
          });
          result.staff.push({
            month: m,
            salary: byCategory['Зарплата_expense'] || 0,
            bonus: byCategory['Премия_expense'] || 0,
            vacation: byCategory['Отпускные_expense'] || 0,
            sickLeave: byCategory['Больничный_expense'] || 0,
          });
        });

        cache.set(cacheKey, result);
        setData(result);
      } catch (err) {
        console.error('Ошибка загрузки аналитики:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  return { data, loading };
}
