// src/store/ergoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ErgoState {
  screenWidth: number;
  screenHeight: number;
  distance: number;
  resultText: string;
}

const initialState: ErgoState = {
  screenWidth: 120,
  screenHeight: 70,
  distance: 300,
  resultText: '',
};

const calculateErgo = (state: ErgoState): string => {
  const diagonal = Math.sqrt(state.screenWidth ** 2 + state.screenHeight ** 2) / 2.54;
  const minDist = diagonal * 2.5;
  const maxDist = diagonal * 4;
  if (state.distance < minDist) return `Слишком близко (мин ${minDist.toFixed(0)} см)`;
  if (state.distance > maxDist) return `Слишком далеко (макс ${maxDist.toFixed(0)} см)`;
  return 'Оптимальное расстояние';
};

const ergoSlice = createSlice({
  name: 'ergo',
  initialState,
  reducers: {
    setErgoConfig: (state, action: PayloadAction<Partial<ErgoState>>) => {
      Object.assign(state, action.payload);
      state.resultText = calculateErgo(state);
    },
  },
});

export const { setErgoConfig } = ergoSlice.actions;
export default ergoSlice.reducer;
