// src/hooks/useFinanceData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../App';
import { withAuthRetry } from '../utils/supabaseHelpers';

// ... (все типы без изменений, как в оригинале)

export const useFinanceData = (period = 'month', customStart?, customEnd?) => {
  // ... (весь код функции, за исключением loadData, где оборачиваем запросы в withAuthRetry)

  const loadData = useCallback(async () => {
    // ...
    try {
      const { start, end } = getDateRange();

      const txList = await withAuthRetry<any[]>(async () => {
        const { data, error } = await supabase
          .from('finance_1c')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .abortSignal(signal);
        return { data: data as any[], error };
      });

      const payments = await withAuthRetry<any[]>(async () => {
        const { data, error } = await supabase
          .from('salary_payments')
          .select('amount, type')
          .gte('date', start)
          .lte('date', end)
          .abortSignal(signal);
        return { data: data as any[], error };
      });
      // ... остальная обработка
    } catch (err) { ... }
  }, [...]);
  // ...
};
