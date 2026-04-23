// src/store/ledSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LedState {
  activeMode: 'cabinets' | 'resolution';
  cabinetWidth: number;
  cabinetHeight: number;
  cabinetsW: number;
  cabinetsH: number;
  pitch: number;
  targetResolution: 'fhd' | '4k' | 'custom';
  customResW: number;
  customResH: number;
  width_m: number;
  height_m: number;
  resW: number;
  resH: number;
  area: number;
  power: number;
}

const initialState: LedState = {
  activeMode: 'cabinets',
  cabinetWidth: 600,
  cabinetHeight: 337.5,
  cabinetsW: 1,
  cabinetsH: 1,
  pitch: 1.2,
  targetResolution: 'fhd',
  customResW: 1920,
  customResH: 1080,
  width_m: 0,
  height_m: 0,
  resW: 0,
  resH: 0,
  area: 0,
  power: 0,
};

const calcCabinet = (state: LedState): Partial<LedState> => {
  const width_m = (state.cabinetWidth / 1000) * state.cabinetsW;
  const height_m = (state.cabinetHeight / 1000) * state.cabinetsH;
  const resW = Math.round(width_m / (state.pitch / 1000));
  const resH = Math.round(height_m / (state.pitch / 1000));
  const area = width_m * height_m;
  const power = area * (state.pitch === 0.7 ? 500 : state.pitch <= 1 ? 450 : 400);
  return { width_m, height_m, resW, resH, area, power };
};

const calcResolution = (state: LedState): Partial<LedState> => {
  let targetW: number, targetH: number;
  if (state.targetResolution === 'fhd') { targetW = 1920; targetH = 1080; }
  else if (state.targetResolution === '4k') { targetW = 3840; targetH = 2160; }
  else { targetW = state.customResW; targetH = state.customResH; }
  const width_m = (targetW * state.pitch) / 1000;
  const height_m = (targetH * state.pitch) / 1000;
  const area = width_m * height_m;
  const power = area * (state.pitch === 0.7 ? 500 : state.pitch <= 1 ? 450 : 400);
  return { width_m, height_m, resW: targetW, resH: targetH, area, power };
};

const ledSlice = createSlice({
  name: 'led',
  initialState,
  reducers: {
    setLedConfig: (state, action: PayloadAction<Partial<LedState>>) => {
      Object.assign(state, action.payload);
      if (state.activeMode === 'cabinets') {
        Object.assign(state, calcCabinet(state));
      } else {
        Object.assign(state, calcResolution(state));
      }
    },
    setLedMode: (state, action: PayloadAction<'cabinets' | 'resolution'>) => {
      state.activeMode = action.payload;
      if (state.activeMode === 'cabinets') {
        Object.assign(state, calcCabinet(state));
      } else {
        Object.assign(state, calcResolution(state));
      }
    },
  },
});

export const { setLedConfig, setLedMode } = ledSlice.actions;
export default ledSlice.reducer;
