// src/store/powerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PowerState {
  totalPower: number;
  upsAutonomy: number;
  resultText: string;
}

const initialState: PowerState = {
  totalPower: 500,
  upsAutonomy: 1,
  resultText: '',
};

const calculatePower = (state: PowerState): string => {
  const requiredVA = Math.ceil(state.totalPower * state.upsAutonomy * 1.2);
  let recommendation = `ИБП ${requiredVA} ВА`;
  if (state.totalPower > 1000) recommendation += ' (рекомендуется 3-фазный)';
  return recommendation;
};

const powerSlice = createSlice({
  name: 'power',
  initialState,
  reducers: {
    setPowerConfig: (state, action: PayloadAction<Partial<PowerState>>) => {
      Object.assign(state, action.payload);
      state.resultText = calculatePower(state);
    },
  },
});

export const { setPowerConfig } = powerSlice.actions;
export default powerSlice.reducer;
