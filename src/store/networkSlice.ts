// src/store/networkSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NetworkState {
  cable: string;
  multicast: boolean;
  qos: boolean;
  networkType: 'managed' | 'unmanaged';
  syncProtocol: 'ptp' | 'ntp' | 'none';
  redundancy: boolean;   // исправлено с redundance
}

const initialState: NetworkState = {
  cable: 'Cat6',
  multicast: false,
  qos: false,
  networkType: 'managed',
  syncProtocol: 'ptp',
  redundancy: false,
};

export const getCableSpeed = (cable: string): number => {
  const speeds: Record<string, number> = {
    Cat5e: 1000, Cat6: 1000, Cat6a: 10000, Cat7: 10000, Cat8: 40000, OM3: 10000, wireless: 100,
  };
  return speeds[cable] || 1000;
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkSettings: (state, action: PayloadAction<Partial<NetworkState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { setNetworkSettings } = networkSlice.actions;
export default networkSlice.reducer;
