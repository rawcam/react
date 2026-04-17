// src/store/vcSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VcState {
  activeMode: 'codec' | 'multipoint';
  codecPreset: string;
  resolution: string;
  fps: number;
  participants: number;
  multipointParticipants: number;
  resultValue: number;
  resultText: string;
}

const initialState: VcState = {
  activeMode: 'codec',
  codecPreset: 'trueconf',
  resolution: '1080p',
  fps: 25,
  participants: 4,
  multipointParticipants: 8,
  resultValue: 0,
  resultText: '',
};

const calculateVc = (state: VcState): { value: number; text: string } => {
  if (state.activeMode === 'codec') {
    const baseBitrates: Record<string, Record<string, number>> = {
      'trueconf': { '720p': 1.5, '1080p': 3, '4K': 12 },
      'webrtc': { '720p': 2, '1080p': 4.5, '4K': 15 },
      'h264': { '720p': 2.5, '1080p': 5, '4K': 20 },
      'h265': { '720p': 1.2, '1080p': 2.5, '4K': 10 },
    };
    const base = (baseBitrates[state.codecPreset]?.[state.resolution] || 3) * (state.fps / 25);
    const total = Math.round(base * state.participants);
    return { value: total, text: `${total} Мбит/с` };
  } else {
    const streams = state.multipointParticipants * (state.multipointParticipants - 1);
    const load = Math.round(streams * 0.5);
    return { value: load, text: `Нагрузка ${load} ед.` };
  }
};

const vcSlice = createSlice({
  name: 'vc',
  initialState,
  reducers: {
    setVcConfig: (state, action: PayloadAction<Partial<VcState>>) => {
      Object.assign(state, action.payload);
      const res = calculateVc(state);
      state.resultValue = res.value;
      state.resultText = res.text;
    },
  },
});

export const { setVcConfig } = vcSlice.actions;
export default vcSlice.reducer;
