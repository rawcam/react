// src/store/ledSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LedState {
  activeMode: 'cabinets' | 'resolution';
  pitch: number;
  cabinetWidth: number;
  cabinetHeight: number;
  cabinetsW: number;
  cabinetsH: number;
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
  pitch: 2.5,
  cabinetWidth: 500,
  cabinetHeight: 500,
  cabinetsW: 4,
  cabinetsH: 3,
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

const calculateLed = (state: LedState): Partial<LedState> => {
  const { activeMode, pitch, cabinetWidth, cabinetHeight, cabinetsW, cabinetsH, targetResolution, customResW, customResH } = state;
  let resW = 0, resH = 0, width_m = 0, height_m = 0;

  if (activeMode === 'cabinets') {
    width_m = (cabinetsW * cabinetWidth) / 1000;
    height_m = (cabinetsH * cabinetHeight) / 1000;
    resW = Math.round((cabinetsW * cabinetWidth) / pitch);
    resH = Math.round((cabinetsH * cabinetHeight) / pitch);
  } else {
    if (targetResolution === 'fhd') { resW = 1920; resH = 1080; }
    else if (targetResolution === '4k') { resW = 3840; resH = 2160; }
    else { resW = customResW; resH = customResH; }
    width_m = (resW * pitch) / 1000;
    height_m = (resH * pitch) / 1000;
  }

  const area = width_m * height_m;
  const power = area * 300;

  return { width_m, height_m, resW, resH, area, power };
};

const ledSlice = createSlice({
  name: 'led',
  initialState,
  reducers: {
    setLedConfig: (state, action: PayloadAction<Partial<LedState>>) => {
      Object.assign(state, action.payload);
      const calc = calculateLed(state);
      Object.assign(state, calc);
    },
  },
});

export const { setLedConfig } = ledSlice.actions;
export default ledSlice.reducer;
