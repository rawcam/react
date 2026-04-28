// src/store/tractsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { calcVideoBitrate, DeviceModel, DEVICE_MODELS, getResolutionFactor } from '../utils/tractCalculations';

export interface TractDevice {
  id: string;
  modelName: string;
  type: string;
  latency: number;
  powerW: number;
  shortName: string;
  ethernet: boolean;
  poeEnabled: boolean;
  poePower: number;
  bitrateFactor?: number;
  hasNetwork?: boolean;
  shortPrefix: string;
  icon: string;
  expanded?: boolean;
  inputs?: number;
  outputs?: number;
  switchingLatency?: number;
  ports?: number;
  poeBudget?: number;
  speed?: number;
  backplane?: number;
  usb?: boolean;
  usbVersion?: string;
  audioEmbed?: number;
  pitch?: number;
  powerPerSqm?: number;
  width_m?: number;
  height_m?: number;
  resW?: number;
  resH?: number;
  area?: number;
  attachedSwitchId?: string;
  attachedPortNumber?: number;
  poe?: boolean; // поддерживает ли устройство PoE
}

export interface NetworkSwitchDevice {
  id: string;
  name: string;
  type: 'networkSwitch';
  ports: { number: number; deviceId: string | null }[];
  switchingLatency: number;
  poeBudget: number;
  powerW: number;
  speed: number;
  backplane: number;
  shortPrefix: string;
  shortName?: string;
  icon: string;
  expanded?: boolean;
  hasNetwork?: boolean;
}

export interface MatrixDevice {
  id: string;
  type: 'matrix';
  name: string;
  inputs: number;
  outputs: number;
  latencyIn: number;
  latencyOut: number;
  powerW: number;
  icon?: string;
  shortPrefix: string;
  expanded?: boolean;
  hasNetwork?: boolean;
}

export type AnyDevice = TractDevice | NetworkSwitchDevice | MatrixDevice;

export interface Tract {
  id: string;
  name: string;
  sourceDevices: TractDevice[];
  matrixDevices: MatrixDevice[];
  sinkDevices: TractDevice[];
  totalLatency: number;
  totalBitrate: number;
  totalPower: number;
  totalPoE: number;
  poeBudgetUsed: number;
  networkLoadPercent?: number;
  totalPorts?: number;
  usedPorts?: number;
  totalPoEBudget?: number;
  usedPoE?: number;
}

interface TractsState {
  tracts: Tract[];
  activeTractId: string | null;
  viewMode: 'all' | 'active' | 'calculator';
  activeCalculator: string | null;
  projectSwitches: (NetworkSwitchDevice | MatrixDevice)[];
}

const initialState: TractsState = {
  tracts: [],
  activeTractId: null,
  viewMode: 'all',
  activeCalculator: null,
  projectSwitches: [],
};

let shortNameCounters: Record<string, number> = {};

const generateShortName = (prefix: string, existing: string[]): string => {
  if (!shortNameCounters[prefix]) {
    let max = 0;
    existing.forEach(name => {
      if (name.startsWith(prefix)) {
        const num = parseInt(name.slice(prefix.length), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    shortNameCounters[prefix] = max;
  }
  shortNameCounters[prefix] += 1;
  return `${prefix}${shortNameCounters[prefix]}`;
};

const resetShortNames = () => { shortNameCounters = {}; };

const createDeviceFromModel = (model: DeviceModel, type: string, pathId: string, segment: string): TractDevice => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
  const base: TractDevice = {
    id,
    modelName: model.name,
    type,
    latency: model.latency || 0,
    powerW: model.powerW || 0,
    shortName: '',
    ethernet: false,
    poeEnabled: false,
    poePower: model.poePower || 0,
    bitrateFactor: model.bitrateFactor,
    hasNetwork: model.hasNetwork !== undefined ? model.hasNetwork : true,
    shortPrefix: model.shortPrefix,
    icon: `fas ${model.icon || 'fa-question-circle'}`,
    expanded: true,
    poe: model.poe,
  };

  if (model.inputs) base.inputs = model.inputs;
  if (model.outputs) base.outputs = model.outputs;
  if (model.switchingLatency) base.switchingLatency = model.switchingLatency;
  if (model.ports) base.ports = model.ports;
  if (model.poeBudget) base.poeBudget = model.poeBudget;
  if (model.speed) base.speed = model.speed;
  if (model.backplane) base.backplane = model.backplane;
  if (model.usb !== undefined) base.usb = model.usb;
  if (model.usbVersion) base.usbVersion = model.usbVersion;
  if (model.audioEmbed) base.audioEmbed = model.audioEmbed;
  if (model.pitch) base.pitch = model.pitch;
  if (model.powerPerSqm) base.powerPerSqm = model.powerPerSqm;

  return base;
};

const reassignPorts = (devices: TractDevice[], switches: (NetworkSwitchDevice | MatrixDevice)[]) => {
  switches.forEach(sw => {
    if (sw.type === 'networkSwitch') {
      sw.ports.forEach(p => p.deviceId = null);
    }
  });

  const networkDevices = devices.filter(d => d.hasNetwork !== false);

  networkDevices.forEach(dev => {
    dev.attachedSwitchId = undefined;
    dev.attachedPortNumber = undefined;
    const needsConnection = dev.poeEnabled || dev.ethernet;
    if (!needsConnection) return;

    for (const sw of switches) {
      if (sw.type !== 'networkSwitch') continue;
      const freePort = sw.ports.find(p => p.deviceId === null);
      if (!freePort) continue;

      const requirePoE = dev.poeEnabled && dev.poePower > 0;
      if (requirePoE && (!sw.poeBudget || sw.poeBudget <= 0)) continue;

      freePort.deviceId = dev.id;
      dev.attachedSwitchId = sw.id;
      dev.attachedPortNumber = freePort.number;
      break;
    }
  });
};

const recalcTract = (
  tract: Tract,
  videoSettings: any,
  networkSettings: any,
  allSwitches: (NetworkSwitchDevice | MatrixDevice)[]
): Tract => {
  const codecFactor = getResolutionFactor(videoSettings) * 0.8;
  let totalLatency = 0;
  let totalBitrate = 0;
  let totalPower = 0;
  let totalPoE = 0;
  let poeBudgetUsed = 0;

  const allDevices = [...tract.sourceDevices, ...tract.sinkDevices];
  const matrixDevices = allSwitches.filter(s => s.type === 'matrix') as MatrixDevice[];

  allDevices.forEach(dev => {
    let devLatency = dev.latency || 0;
    if (dev.usb) devLatency += 0.5;
    if (dev.audioEmbed) devLatency += 1.0;
    if (dev.type === 'tx' || dev.type === 'rx') devLatency *= codecFactor;
    totalLatency += devLatency;
    totalPower += dev.powerW || 0;
    if (dev.poeEnabled) {
      totalPoE += dev.poePower || 0;
      poeBudgetUsed += dev.poePower || 0;
    }
    if (dev.ethernet || dev.hasNetwork) {
      let bitrate = calcVideoBitrate(videoSettings);
      if (dev.type === 'tx') bitrate *= (dev.bitrateFactor || 0.8);
      totalBitrate += bitrate;
    }
  });

  matrixDevices.forEach(m => {
    totalLatency += (m.latencyIn || 0) + (m.latencyOut || 0);
    totalPower += m.powerW || 0;
    if (m.hasNetwork !== false) {
      totalBitrate += calcVideoBitrate(videoSettings) * (m.inputs || 1);
    }
  });

  const networkSwitches = allSwitches.filter(s => s.type === 'networkSwitch') as NetworkSwitchDevice[];
  let totalPoEBudget = 0;
  networkSwitches.forEach(sw => {
    totalLatency += sw.switchingLatency || 0;
    totalPower += sw.powerW || 0;
    if (sw.poeBudget) totalPoEBudget += sw.poeBudget;
  });

  if (networkSettings.multicast) totalBitrate *= 1.1;
  if (networkSettings.qos) totalBitrate *= 1.05;

  const totalPorts = networkSwitches.reduce((s, sw) => s + sw.ports.length, 0);
  const usedPorts = networkSwitches.reduce((s, sw) => s + sw.ports.filter(p => p.deviceId !== null).length, 0);
  const usedPoE = networkSwitches.reduce((s, sw) => {
    return s + sw.ports.filter(p => p.deviceId).reduce((sum, p) => {
      const dev = allDevices.find(d => d.id === p.deviceId);
      return sum + (dev?.poeEnabled ? dev.poePower || 0 : 0);
    }, 0);
  }, 0);

  const minBackplane = networkSwitches.length > 0
    ? Math.min(...networkSwitches.map(s => s.backplane || 100)) * 1000
    : 1000;
  const loadPercent = (totalBitrate / minBackplane) * 100;

  return {
    ...tract,
    totalLatency,
    totalBitrate: Math.round(totalBitrate),
    totalPower,
    totalPoE,
    poeBudgetUsed,
    networkLoadPercent: loadPercent > 100 ? 100 : loadPercent,
    totalPorts,
    usedPorts,
    totalPoEBudget,
    usedPoE,
  };
};

const tractsSlice = createSlice({
  name: 'tracts',
  initialState,
  reducers: {
    setTracts: (state, action: PayloadAction<Tract[]>) => {
      state.tracts = action.payload;
    },
    addTract: (state, action: PayloadAction<Omit<Tract, 'id'> & { id?: string }>) => {
      const newId = action.payload.id || Date.now().toString();
      const newTract: Tract = {
        ...action.payload,
        id: newId,
        sourceDevices: action.payload.sourceDevices || [],
        matrixDevices: action.payload.matrixDevices || [],
        sinkDevices: action.payload.sinkDevices || [],
        totalLatency: 0,
        totalBitrate: 0,
        totalPower: 0,
        totalPoE: 0,
        poeBudgetUsed: 0,
      };
      state.tracts.push(newTract);
      state.activeTractId = newId;
    },
    updateTract: (state, action: PayloadAction<Tract>) => {
      const index = state.tracts.findIndex(t => t.id === action.payload.id);
      if (index !== -1) state.tracts[index] = action.payload;
    },
    deleteTract: (state, action: PayloadAction<string>) => {
      state.tracts = state.tracts.filter(t => t.id !== action.payload);
      if (state.activeTractId === action.payload) {
        state.activeTractId = state.tracts.length ? state.tracts[0].id : null;
      }
    },
    setActiveTract: (state, action: PayloadAction<string | null>) => {
      state.activeTractId = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'all' | 'active' | 'calculator'>) => {
      state.viewMode = action.payload;
    },
    setActiveCalculator: (state, action: PayloadAction<string | null>) => {
      state.activeCalculator = action.payload;
    },
    addDeviceToTract: (state, action: PayloadAction<{ tractId: string; device: TractDevice; column: 'source' | 'matrix' | 'sink' }>) => {
      const tract = state.tracts.find(t => t.id === action.payload.tractId);
      if (!tract) return;
      const { device, column } = action.payload;
      const targetArray = column === 'source' ? tract.sourceDevices : tract.sinkDevices;
      targetArray.push(device);
      resetShortNames();
      const allExisting = [...tract.sourceDevices, ...tract.sinkDevices].map(d => d.shortName).filter(Boolean);
      device.shortName = generateShortName(device.shortPrefix || 'DEV', allExisting);
    },
    removeDeviceFromTract: (state, action: PayloadAction<{ tractId: string; deviceId: string }>) => {
      const tract = state.tracts.find(t => t.id === action.payload.tractId);
      if (!tract) return;
      tract.sourceDevices = tract.sourceDevices.filter(d => d.id !== action.payload.deviceId);
      tract.sinkDevices = tract.sinkDevices.filter(d => d.id !== action.payload.deviceId);
    },
    addSwitch: (state, action: PayloadAction<NetworkSwitchDevice | MatrixDevice>) => {
      state.projectSwitches.push(action.payload);
    },
    removeSwitch: (state, action: PayloadAction<string>) => {
      state.projectSwitches = state.projectSwitches.filter(s => s.id !== action.payload);
    },
    updateDevice: (state, action: PayloadAction<{ tractId: string; deviceId: string; updates: Partial<TractDevice> }>) => {
      const tract = state.tracts.find(t => t.id === action.payload.tractId);
      if (!tract) return;
      for (const arr of [tract.sourceDevices, tract.sinkDevices]) {
        const dev = arr.find(d => d.id === action.payload.deviceId);
        if (dev) {
          Object.assign(dev, action.payload.updates);
          break;
        }
      }
    },
    recalcAllTracts: (state) => {
      // placeholder – actual recalculation happens in component
    },
  },
});

export const {
  setTracts, addTract, updateTract, deleteTract,
  setActiveTract, setViewMode, setActiveCalculator,
  addDeviceToTract, removeDeviceFromTract,
  addSwitch, removeSwitch, updateDevice,
} = tractsSlice.actions;

export const recalcAll = (state: TractsState, videoSettings: any, networkSettings: any) => {
  state.tracts.forEach(tract => {
    const updated = recalcTract(tract, videoSettings, networkSettings, state.projectSwitches);
    Object.assign(tract, updated);
  });
  state.tracts.forEach(tract => {
    reassignPorts([...tract.sourceDevices, ...tract.sinkDevices], state.projectSwitches);
  });
};

export default tractsSlice.reducer;
