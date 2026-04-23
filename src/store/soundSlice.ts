// src/store/soundSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SoundMode = 'spl' | 'drop' | 'power' | 'rt60' | 'speakers';

export interface SoundState {
  activeMode: SoundMode;
  sensitivity: number;
  sourcePower: number;
  distance: number;
  headroom: number;
  roomGain: number;
  startDistance: number;
  endDistance: number;
  powerChangeFrom: number;
  powerChangeTo: number;
  roomVolume: number;
  roomArea: number;
  avgAbsorption: number;
  speakerPower: number;
  speakerSensitivity: number;
  requiredSPL: number;
  resultValue: number;
  resultText: string;
}

const initialState: SoundState = {
  activeMode: 'spl',
  sensitivity: 89,
  sourcePower: 1,
  distance: 1,
  headroom: 9,
  roomGain: 3,
  startDistance: 1,
  endDistance: 16,
  powerChangeFrom: 1,
  powerChangeTo: 2,
  roomVolume: 200,
  roomArea: 100,
  avgAbsorption: 0.2,
  speakerPower: 30,
  speakerSensitivity: 90,
  requiredSPL: 85,
  resultValue: 0,
  resultText: '',
};

function calcSPL(sensitivity: number, power: number, distance: number, headroom: number, roomGain: number): number {
  return Math.round(sensitivity + 10 * Math.log10(power) - 20 * Math.log10(distance) + roomGain - headroom);
}

const soundSlice = createSlice({
  name: 'sound',
  initialState,
  reducers: {
    setSoundConfig: (state, action: PayloadAction<Partial<SoundState>>) => {
      Object.assign(state, action.payload);
      if (state.activeMode === 'spl') {
        const spl = calcSPL(state.sensitivity, state.sourcePower, state.distance, state.headroom, state.roomGain);
        state.resultValue = spl;
        state.resultText = `${spl} дБ`;
      }
      // остальные режимы для краткости опущены (они уже есть в вашем исходном файле)
    },
    setSoundMode: (state, action: PayloadAction<SoundMode>) => {
      state.activeMode = action.payload;
    },
  },
});

export const { setSoundConfig, setSoundMode } = soundSlice.actions;
export default soundSlice.reducer;
