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
  fps: 30,
  participants: 2,
  multipointParticipants: 4,
  resultValue: 0,
  resultText: '',
};

const codecBitrates: Record<string, number> = {
  trueconf: 2.5, webrtc: 2.0, h264: 4.0, h265: 2.5,
};
const resolutionFactor: Record<string, number> = {
  '1080p': 1, '720p': 0.5, '4K': 2,
};

const vcSlice = createSlice({
  name: 'vc',
  initialState,
  reducers: {
    setVcConfig: (state, action: PayloadAction<Partial<VcState>>) => {
      Object.assign(state, action.payload);
      if (state.activeMode === 'codec') {
        const base = codecBitrates[state.codecPreset] || 2.5;
        const res = resolutionFactor[state.resolution] || 1;
        const per = Math.round(base * res * (state.fps / 30));
        const total = per * state.participants;
        state.resultValue = total;
        state.resultText = `${total} Мбит/с (${per} Мбит/с/уч.)`;
      } else {
        const load = Math.round(state.multipointParticipants * 1.5);
        state.resultValue = load;
        state.resultText = `Нагрузка: ${load} Мбит/с`;
      }
    },
    setVcMode: (state, action: PayloadAction<VcState['activeMode']>) => {
      state.activeMode = action.payload;
    },
  },
});

export const { setVcConfig, setVcMode } = vcSlice.actions;
export default vcSlice.reducer;
