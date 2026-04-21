// src/hooks/useFinanceData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface FinanceData {
  revenue: string;
  revenueTrend: number;
  netProfit: string;
  profitTrend: number;
  receivables: string;
  receivablesTrend: number;
  payables: string;
  payablesTrend: number;
  incoming: string;
  outgoing: string;
  balance: string;
  sales: string;
  advances: string;
  equipment: string;
  salary: string;
  rent: string;
  projectsPlanFact: Array<{
    name: string;
    plan: string;
    fact: string;
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
  isDemo: boolean;
}

// Демо-данные (эмуляция ответа от 1С)
const DEMO_DATA: FinanceData = {
  revenue: '12.4M',
  revenueTrend: 8.2,
  netProfit: '3.1M',
  profitTrend: 5.4,
  receivables: '5.2M',
  receivablesTrend: -12,
  payables: '2.8M',
  payablesTrend: 3.1,
  incoming: '8.7M',
  outgoing: '5.6M',
  balance: '3.1M',
  sales: '6.2M',
  advances: '2.5M',
  equipment: '3.1M',
  salary: '1.8M',
  rent: '0.7M',
  projectsPlanFact: [
    { name: 'Офис продаж (0001)', plan: '2.8M', fact: '2.5M', progress: 89, margin: 22 },
    { name: 'Конференц-зал (0002)', plan: '8.7M', fact: '8.7M', progress: 100, margin: 31 },
    { name: 'Школа будущего (0003)', plan: '22.1M', fact: '15.4M', progress: 70, margin: 18 },
  ],
  transactions: [
    { id: 24, date: '20.04.2026', description: 'Поступление от заказчика (0002)', amount: 2500000, status: 'Проведено', hasDocument: true },
    { id: 23, date: '18.04.2026', description: 'Закупка оборудования (Siemens)', amount: 850000, status: 'Проведено', hasDocument: true },
    { id: 22, date: '15.04.2026', description: 'Аванс подрядчику', amount: 420000, status: 'В обработке', hasDocument: false },
    { id: 21, date: '12.04.2026', description: 'Зарплата за март', amount: 1200000, status: 'Проведено', hasDocument: true },
    { id: 20, date: '10.04.2026', description: 'Поступление от заказчика (0001)', amount: 1800000, status: 'Проведено', hasDocument: true },
    { id: 19, date: '05.04.2026', description: 'Закупка кабеля', amount: 320000, status: 'Проведено', hasDocument: true },
    { id: 18, date: '02.04.2026', description: 'Аренда офиса', amount: 180000, status: 'Проведено', hasDocument: true },
    { id: 17, date: '28.03.2026', description: 'Поступление от заказчика (0003)', amount: 5000000, status: 'Проведено', hasDocument: true },
    { id: 16, date: '25.03.2026', description: 'Закупка ПО', amount: 450000, status: 'Проведено', hasDocument: true },
    { id: 15, date: '22.03.2026', description: 'Оплата подрядчику', amount: 670000, status: 'В обработке', hasDocument: false },
  ],
  lastSync: new Date().toLocaleString('ru-RU'),
  isDemo: true,
};

export const useFinanceData = () => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // В будущем здесь будет запрос к Supabase (данные, загруженные из 1С)
      // const { data: financeData, error } = await supabase.from('finance_1c').select('*').single();
      // if (error) throw error;
      // setData(financeData);
      
      // Пока используем демо-данные
      await new Promise(resolve => setTimeout(resolve, 500)); // имитация задержки
      setData(DEMO_DATA);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncWith1C = useCallback(async () => {
    alert('Запрос на синхронизацию с 1С (демо). В реальности здесь будет вызов Edge Function.');
    // В реальности: await supabase.functions.invoke('sync-1c');
    await loadData(); // перезагружаем демо-данные
  }, [loadData]);

  return { data, loading, syncWith1C };
};
