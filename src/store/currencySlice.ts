// src/store/currencySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrencyState {
  usdRate: number;
  eurRate: number;
}

const initialState: CurrencyState = {
  usdRate: 90,
  eurRate: 100,
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setUsdRate: (state, action: PayloadAction<number>) => {
      state.usdRate = action.payload;
    },
    setEurRate: (state, action: PayloadAction<number>) => {
      state.eurRate = action.payload;
    },
  },
});

export const { setUsdRate, setEurRate } = currencySlice.actions;
export default currencySlice.reducer;
