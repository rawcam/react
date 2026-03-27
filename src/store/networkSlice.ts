import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface NetworkSettings {
  cable: string
  multicast: boolean
  qos: boolean
  networkType: 'managed' | 'unmanaged'
  syncProtocol: 'ptp' | 'ntp' | 'none'
  redundancy: boolean
}

const initialState: NetworkSettings = {
  cable: 'Cat6',
  multicast: false,
  qos: false,
  networkType: 'managed',
  syncProtocol: 'ptp',
  redundancy: false,
}

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkSettings: (state, action: PayloadAction<Partial<NetworkSettings>>) => {
      Object.assign(state, action.payload)
    },
  },
})

export const { setNetworkSettings } = networkSlice.actions
export default networkSlice.reducer
