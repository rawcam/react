import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TractDevice {
  id: string
  type: string
  modelName: string
  latency: number
  poeEnabled?: boolean
  powerW: number
  shortName: string
  attachedSwitchId?: string
  attachedPortNumber?: number
  ethernet?: boolean
}

export interface Tract {
  id: string
  name: string
  sourceDevices: TractDevice[]
  sinkDevices: TractDevice[]
  totalLatency: number
  totalPower: number
  totalBitrate: number
}

interface TractsState {
  tracts: Tract[]
  activeTractId: string | null
  viewMode: 'single' | 'all'
}

const initialState: TractsState = {
  tracts: [],
  activeTractId: null,
  viewMode: 'single',
}

const tractsSlice = createSlice({
  name: 'tracts',
  initialState,
  reducers: {
    addTract: (state, action: PayloadAction<Tract>) => {
      state.tracts.push(action.payload)
    },
    updateTract: (state, action: PayloadAction<Tract>) => {
      const index = state.tracts.findIndex(t => t.id === action.payload.id)
      if (index !== -1) state.tracts[index] = action.payload
    },
    deleteTract: (state, action: PayloadAction<string>) => {
      state.tracts = state.tracts.filter(t => t.id !== action.payload)
      if (state.activeTractId === action.payload) state.activeTractId = null
    },
    setActiveTract: (state, action: PayloadAction<string | null>) => {
      state.activeTractId = action.payload
    },
    setViewMode: (state, action: PayloadAction<'single' | 'all'>) => {
      state.viewMode = action.payload
    },
  },
})

export const { addTract, updateTract, deleteTract, setActiveTract, setViewMode } = tractsSlice.actions
export default tractsSlice.reducer
