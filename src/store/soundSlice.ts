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
  speakerSensitivity: number;
  requiredSPL: number;
  resultValue: number;
  resultText: string;
}

const initialState: SoundState = {
  activeMode: 'spl',
  sensitivity: 90,
  sourcePower: 100,
  distance: 10,
  headroom: 6,
  roomGain: 3,
  startDistance: 1,
  endDistance: 10,
  powerChangeFrom: 100,
  powerChangeTo: 200,
  roomVolume: 200,
  roomArea: 150,
  avgAbsorption: 0.25,
  speakerSensitivity: 88,
  requiredSPL: 95,
  resultValue: 0,
  resultText: '',
};

const calculateResult = (state: SoundState): { value: number; text: string } => {
  let value = 0;
  let text = '';
  const log10 = Math.log10;

  switch (state.activeMode) {
    case 'spl': {
      const spl = state.sensitivity + 10 * log10(state.sourcePower) - 20 * log10(state.distance) + state.roomGain - state.headroom;
      value = Math.round(spl * 10) / 10;
      text = `${value} дБ на расстоянии ${state.distance} м`;
      break;
    }
    case 'drop': {
      const drop = 20 * log10(state.endDistance / state.startDistance);
      value = Math.round(drop * 10) / 10;
      text = `Падение SPL: ${value} дБ`;
      break;
    }
    case 'power': {
      const change = 10 * log10(state.powerChangeTo / state.powerChangeFrom);
      value = Math.round(change * 10) / 10;
      text = `Изменение SPL: ${value} дБ`;
      break;
    }
    case 'rt60': {
      const V = state.roomVolume;
      const S = state.roomArea;
      const a = state.avgAbsorption;
      const rt60 = (0.161 * V) / (S * a);
      value = Math.round(rt60 * 100) / 100;
      text = `RT60 = ${value} с`;
      break;
    }
    case 'speakers': {
      const neededPower = Math.pow(10, (state.requiredSPL - state.speakerSensitivity + 20 * log10(state.distance)) / 10);
      value = Math.round(neededPower);
      text = `Требуемая мощность: ${value} Вт`;
      break;
    }
  }

  return { value, text };
};

const soundSlice = createSlice({
  name: 'sound',
  initialState,
  reducers: {
    setSoundConfig: (state, action: PayloadAction<Partial<SoundState>>) => {
      Object.assign(state, action.payload);
      const { value, text } = calculateResult(state);
      state.resultValue = value;
      state.resultText = text;
    },
  },
});

export const { setSoundConfig } = soundSlice.actions;
export default soundSlice.reducer;
