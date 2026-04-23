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
  const spl = sensitivity + 10 * Math.log10(power) - 20 * Math.log10(distance) + roomGain;
  return Math.round(spl - headroom);
}

function calcDrop(startSPL: number, startDist: number, endDist: number): number {
  return Math.round(startSPL - 20 * Math.log10(endDist / startDist));
}

function calcPowerChange(startSPL: number, startPower: number, endPower: number): number {
  return Math.round(startSPL + 10 * Math.log10(endPower / startPower));
}

function calcRT60(volume: number, area: number, absorption: number): number {
  return Math.round((0.161 * volume) / (area * absorption) * 100) / 100;
}

function calcRequiredPower(requiredSPL: number, sensitivity: number, distance: number): number {
  return Math.pow(10, (requiredSPL - sensitivity + 20 * Math.log10(distance)) / 10);
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
      } else if (state.activeMode === 'drop') {
        const splAtStart = calcSPL(state.sensitivity, state.sourcePower, state.startDistance, state.headroom, state.roomGain);
        const drop = calcDrop(splAtStart, state.startDistance, state.endDistance);
        state.resultValue = drop;
        state.resultText = `${drop} дБ`;
      } else if (state.activeMode === 'power') {
        const splAtStart = calcSPL(state.sensitivity, state.sourcePower, state.startDistance, state.headroom, state.roomGain);
        const newSPL = calcPowerChange(splAtStart, state.powerChangeFrom, state.powerChangeTo);
        state.resultValue = newSPL;
        state.resultText = `${newSPL} дБ`;
      } else if (state.activeMode === 'rt60') {
        const rt60 = calcRT60(state.roomVolume, state.roomArea, state.avgAbsorption);
        state.resultValue = rt60;
        state.resultText = `${rt60} с`;
      } else if (state.activeMode === 'speakers') {
        const power = calcRequiredPower(state.requiredSPL, state.speakerSensitivity, state.distance);
        state.resultValue = power;
        state.resultText = `${Math.round(power)} Вт`;
      }
    },
    setSoundMode: (state, action: PayloadAction<SoundMode>) => {
      state.activeMode = action.payload;
    },
  },
});

export const { setSoundConfig, setSoundMode } = soundSlice.actions;
export default soundSlice.reducer;
