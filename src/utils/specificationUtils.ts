// src/utils/specificationUtils.ts
import { SpecRow } from '../store/specificationsSlice';

export const getSpecTotalRub = (rows: SpecRow[], usdRate: number, eurRate: number): number => {
  let total = 0;
  for (const row of rows) {
    if (row.type !== 'data') continue;
    const qty = row.quantity || 1;

    // 1. Новая модель (currency + priceAfter)
    if (row.currency && row.priceAfter !== undefined) {
      let rate = 1;
      if (row.currency === 'USD') rate = usdRate;
      if (row.currency === 'EUR') rate = eurRate;
      total += row.priceAfter * qty * rate;
    }
    // 2. Старая модель (для обратной совместимости)
    else if (row.priceRub) {
      total += row.priceRub * qty;
    } else if (row.priceUsd) {
      total += row.priceUsd * usdRate * qty;
    } else if (row.priceEur) {
      total += row.priceEur * eurRate * qty;
    }
  }
  return total;
};
