// src/store/tractsSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from './index';

export interface TractDevice {
  id: string;
  type: string;
  modelName: string;
  latency: number;
  poe: boolean;
  poeEnabled: boolean;
  poePower: number;
  powerW: number;
  shortName: string;
  ethernet: boolean;
  bitrateFactor?: number;
  hasNetwork?: boolean;
  shortPrefix?: string;
  usb?: boolean;
  usbVersion?: string;
  expanded?: boolean;
  ports?: number;
  poeBudget?: number;
  switchingLatency?: number;
  inputs?: number;
  outputs?: number;
  latencyIn?: number;
  latencyOut?: number;
  speed?: number;
}

export interface Tract {
  id: string;
  name: string;
  sourceDevices: TractDevice[];
  matrixDevices: TractDevice[];
  sinkDevices: TractDevice[];
  totalLatency: number;
  totalBitrate: number;
  totalPower: number;
  totalPoE: number;
  poeBudgetUsed: number;
}

interface TractsState {
  tracts: Tract[];
  activeTractId: string | null;
  viewMode: 'all' | 'active';
}

const initialState: TractsState = {
  tracts: [],
  activeTractId: null,
  viewMode: 'all',
};

// Расчёт битрейта на основе видео настроек
const calcBitrateFromVideo = (video: any): number => {
  const resMap: Record<string, number> = { '1080p': 1920 * 1080, '4K': 3840 * 2160, '8K': 7680 * 4320 };
  const pixels = resMap[video.resolution] || 1920 * 1080;
  const chromaFactor = { '444': 3, '422': 2, '420': 1.5 }[video.chroma] || 2;
  const colorFactor = video.colorSpace === 'RGB' ? 3 : 2;
  const bitDepthFactor = (video.bitDepth || 8) / 8;
  return (pixels * video.fps * chromaFactor * colorDepthFactor * bitDepthFactor) / 1_000_000;
};

// Пересчёт тракта
const recalcTract = (tract: Tract, videoSettings: any, networkSettings: any): Tract => {
  let totalLatency = 0;
  let totalBitrate = 0;
  let totalPower = 0;
  let totalPoE = 0;
  let poeBudgetUsed = 0;

  const allDevices = [...tract.sourceDevices, ...tract.matrixDevices, ...tract.sinkDevices];

  allDevices.forEach(d => {
    totalLatency += d.latency + (d.switchingLatency || 0);
    totalPower += d.powerW;
    if (d.poeEnabled) {
      totalPoE += d.poePower;
      poeBudgetUsed += d.poePower;
    }
    if (d.ethernet) {
      const baseBitrate = calcBitrateFromVideo(videoSettings);
      totalBitrate += baseBitrate * (d.bitrateFactor || 1);
    }
  });

  // Учёт сети
  if (networkSettings.multicast) totalBitrate *= 1.1;
  if (networkSettings.qos) totalBitrate *= 1.05;

  return {
    ...tract,
    totalLatency,
    totalBitrate: Math.round(totalBitrate),
    totalPower,
    totalPoE,
    poeBudgetUsed,
  };
};

// Thunk для пересчёта активного тракта
export const recalcTractThunk = createAsyncThunk(
  'tracts/recalc',
  async (tractId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const tract = state.tracts.tracts.find(t => t.id === tractId);
    if (!tract) return;
    const updated = recalcTract(tract, state.video, state.network);
    dispatch(updateTract(updated));
  }
);

// Thunk для обновления устройства и пересчёта
export const updateDeviceThunk = createAsyncThunk(
  'tracts/updateDevice',
  async ({ tractId, deviceId, updates }: { tractId: string; deviceId: string; updates: Partial<TractDevice> }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const tract = state.tracts.tracts.find(t => t.id === tractId);
    if (!tract) return;

    const updateInColumn = (devices: TractDevice[]) =>
      devices.map(d => d.id === deviceId ? { ...d, ...updates } : d);

    const updatedTract = {
      ...tract,
      sourceDevices: updateInColumn(tract.sourceDevices),
      matrixDevices: updateInColumn(tract.matrixDevices),
      sinkDevices: updateInColumn(tract.sinkDevices),
    };

    const recalc = recalcTract(updatedTract, state.video, state.network);
    dispatch(updateTract(recalc));
  }
);

// Thunk для удаления устройства
export const removeDeviceThunk = createAsyncThunk(
  'tracts/removeDevice',
  async ({ tractId, deviceId, column }: { tractId: string; deviceId: string; column: 'source' | 'matrix' | 'sink' }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const tract = state.tracts.tracts.find(t => t.id === tractId);
    if (!tract) return;

    const updatedTract = {
      ...tract,
      [column === 'source' ? 'sourceDevices' : column === 'matrix' ? 'matrixDevices' : 'sinkDevices']:
        tract[column === 'source' ? 'sourceDevices' : column === 'matrix' ? 'matrixDevices' : 'sinkDevices'].filter(d => d.id !== deviceId),
    };

    const recalc = recalcTract(updatedTract, state.video, state.network);
    dispatch(updateTract(recalc));
  }
);

const tractsSlice = createSlice({
  name: 'tracts',
  initialState,
  reducers: {
    setTracts: (state, action: PayloadAction<Tract[]>) => {
      state.tracts = action.payload;
    },
    addTract: (state, action: PayloadAction<Omit<Tract, 'id'>>) => {
      const newId = Date.now().toString();
      state.tracts.push({ ...action.payload, id: newId });
    },
    updateTract: (state, action: PayloadAction<Tract>) => {
      const index = state.tracts.findIndex(t => t.id === action.payload.id);
      if (index !== -1) state.tracts[index] = action.payload;
    },
    deleteTract: (state, action: PayloadAction<string>) => {
      state.tracts = state.tracts.filter(t => t.id !== action.payload);
    },
    setActiveTract: (state, action: PayloadAction<string | null>) => {
      state.activeTractId = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'all' | 'active'>) => {
      state.viewMode = action.payload;
    },
    addDeviceToTract: (state, action: PayloadAction<{ tractId: string; device: TractDevice; column: 'source' | 'matrix' | 'sink' }>) => {
      const tract = state.tracts.find(t => t.id === action.payload.tractId);
      if (!tract) return;
      if (action.payload.column === 'source') tract.sourceDevices.push(action.payload.device);
      else if (action.payload.column === 'matrix') tract.matrixDevices.push(action.payload.device);
      else tract.sinkDevices.push(action.payload.device);
    },
  },
});

export const { setTracts, addTract, updateTract, deleteTract, setActiveTract, setViewMode, addDeviceToTract } = tractsSlice.actions;
export default tractsSlice.reducer;
