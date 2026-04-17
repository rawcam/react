// src/store/videoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VideoState {
  resolution: string;
  chroma: string;
  fps: number;
  colorSpace: string;
  bitDepth: number;
}

const initialState: VideoState = {
  resolution: '1080p',
  chroma: '422',
  fps: 25,
  colorSpace: 'YCbCr',
  bitDepth: 8,
};

export const calcVideoBitrate = (settings: VideoState): number => {
  const resMap: Record<string, number> = {
    '720p': 1280 * 720,
    '1080p': 1920 * 1080,
    '4K': 3840 * 2160,
    '8K': 7680 * 4320,
  };
  const pixels = resMap[settings.resolution] || 1920 * 1080;
  const chromaFactor = { '444': 3, '422': 2, '420': 1.5 }[settings.chroma] || 2;
  const colorFactor = settings.colorSpace === 'RGB' ? 3 : 2;
  const bitDepthFactor = (settings.bitDepth || 8) / 8;
  return Math.round((pixels * settings.fps * chromaFactor * colorFactor * bitDepthFactor) / 1_000_000);
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideoSettings: (state, action: PayloadAction<Partial<VideoState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { setVideoSettings } = videoSlice.actions;
export default videoSlice.reducer;
