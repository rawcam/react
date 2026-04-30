// src/hooks/useTractEngine.ts
import { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { calcVideoBitrate, DeviceModel, DEVICE_MODELS } from '../utils/tractCalculations';

// Типы как в старом проекте
export interface TractDeviceSimple {
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
  poe?: boolean;
}

export interface NetworkSwitchSimple {
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

export interface MatrixSimple {
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
  shortName?: string;
  expanded?: boolean;
  hasNetwork?: boolean;
}

export interface TractSimple {
  id: string;
  name: string;
  sourceDevices: TractDeviceSimple[];
  matrixDevices: MatrixSimple[];
  sinkDevices: TractDeviceSimple[];
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

let shortNameCounters: Record<string, number> = {};

const getResolutionFactor = (resolution: string): number => {
  const map: Record<string, number> = { '1080p': 1.0, '4K': 1.5, '8K': 2.5 };
  return map[resolution] || 1.0;
};

// Универсальная фабрика устройств
const createDevice = (model: Partial<DeviceModel> & { name: string }, type: string): TractDeviceSimple => ({
  id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
  modelName: model.name,
  type,
  latency: model.latency || 0,
  powerW: model.powerW || 0,
  shortName: '',
  ethernet: false,
  poeEnabled: false,
  poePower: model.poePower || 0,
  bitrateFactor: (model as any).bitrateFactor,
  hasNetwork: model.hasNetwork !== undefined ? model.hasNetwork : true,
  shortPrefix: model.shortPrefix || 'DEV',
  icon: `fas ${model.icon || 'fa-question-circle'}`,
  expanded: true,
  inputs: model.inputs,
  outputs: model.outputs,
  poe: (model as any).poe,
  usb: (model as any).usb,
  usbVersion: (model as any).usbVersion,
  audioEmbed: (model as any).audioEmbed,
  width_m: (model as any).width_m,
  height_m: (model as any).height_m,
  resW: (model as any).resW,
  resH: (model as any).resH,
  area: (model as any).area,
  pitch: (model as any).pitch,
  powerPerSqm: (model as any).powerPerSqm,
});

export const useTractEngine = () => {
  const videoSettings = useSelector((state: RootState) => state.video);
  const networkSettings = useSelector((state: RootState) => state.network);

  const [tracts, setTracts] = useState<TractSimple[]>([]);
  const [activeTractId, setActiveTractId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Пересчёт тракта по текущим настройкам видео и сети
  const recalc = useCallback(
    (tract: TractSimple): TractSimple => {
      const codecFactor = getResolutionFactor(videoSettings.resolution) * 0.8;
      let totalLat = 0, totalBit = 0, totalPwr = 0, totalPoe = 0, poeUsed = 0;
      const devices = [...tract.sourceDevices, ...tract.sinkDevices];

      devices.forEach(d => {
        let dl = d.latency || 0;
        if (d.usb) dl += 0.5;
        if (d.audioEmbed) dl += 1.0;
        if (d.type === 'tx' || d.type === 'rx') dl *= codecFactor;
        totalLat += dl;
        totalPwr += d.powerW || 0;
        if (d.poeEnabled) {
          totalPoe += d.poePower || 0;
          poeUsed += d.poePower || 0;
        }
        if (d.ethernet || d.hasNetwork) {
          let br = calcVideoBitrate(videoSettings);
          if (d.type === 'tx') br *= (d.bitrateFactor || 0.8);
          totalBit += br;
        }
      });

      tract.matrixDevices.forEach(m => {
        totalLat += (m.latencyIn || 0) + (m.latencyOut || 0);
        totalPwr += m.powerW || 0;
      });

      if (networkSettings.multicast) totalBit *= 1.1;
      if (networkSettings.qos) totalBit *= 1.05;

      return {
        ...tract,
        totalLatency: totalLat,
        totalBitrate: Math.round(totalBit),
        totalPower: totalPwr,
        totalPoE: totalPoe,
        poeBudgetUsed: poeUsed,
        networkLoadPercent: 0,
        totalPorts: 0,
        usedPorts: 0,
        totalPoEBudget: 0,
        usedPoE: 0,
      };
    },
    [videoSettings, networkSettings]
  );

  const recalcAll = useCallback(() => {
    setTracts(prev => prev.map(t => recalc(t)));
  }, [recalc]);

  // Обновление имени тракта
  const renameTract = useCallback((tractId: string, newName: string) => {
    setTracts(prev =>
      prev.map(t => (t.id === tractId ? { ...t, name: newName } : t))
    );
  }, []);

  const addTract = useCallback((name: string) => {
    const id = Date.now().toString();
    const newTract: TractSimple = {
      id,
      name,
      sourceDevices: [],
      matrixDevices: [],
      sinkDevices: [],
      totalLatency: 0,
      totalBitrate: 0,
      totalPower: 0,
      totalPoE: 0,
      poeBudgetUsed: 0,
    };
    setTracts(prev => [...prev, recalc(newTract)]);
    setActiveTractId(id);
    setShowAll(false);
  }, [recalc]);

  const addDevice = useCallback((tractId: string, model: Partial<DeviceModel> & { name: string }, type: string, column: 'source' | 'matrix' | 'sink') => {
    setTracts(prev =>
      prev.map(t => {
        if (t.id !== tractId) return t;
        const dev = createDevice(model, type);
        const newTract = { ...t };
        if (column === 'matrix') {
          const matrix: MatrixSimple = {
            id: dev.id,
            type: 'matrix',
            name: model.name,
            inputs: model.inputs || 1,
            outputs: model.outputs || 1,
            latencyIn: 0,
            latencyOut: 0,
            powerW: model.powerW || 0,
            icon: `fas ${model.icon || 'fa-project-diagram'}`,
            shortPrefix: model.shortPrefix || 'MX',
            shortName: '',
            expanded: true,
            hasNetwork: model.hasNetwork !== false,
          };
          newTract.matrixDevices = [...t.matrixDevices, matrix];
        } else if (column === 'source') {
          newTract.sourceDevices = [...t.sourceDevices, dev];
        } else {
          newTract.sinkDevices = [...t.sinkDevices, dev];
        }
        return recalc(newTract);
      })
    );
  }, [recalc]);

  const removeDevice = useCallback((tractId: string, deviceId: string) => {
    setTracts(prev =>
      prev.map(t => {
        if (t.id !== tractId) return t;
        const newTract = { ...t };
        newTract.sourceDevices = t.sourceDevices.filter(d => d.id !== deviceId);
        newTract.matrixDevices = t.matrixDevices.filter(d => d.id !== deviceId);
        newTract.sinkDevices = t.sinkDevices.filter(d => d.id !== deviceId);
        return recalc(newTract);
      })
    );
  }, [recalc]);

  const updateDevice = useCallback((tractId: string, deviceId: string, updates: Partial<TractDeviceSimple>) => {
    setTracts(prev =>
      prev.map(t => {
        if (t.id !== tractId) return t;
        const updateArray = (arr: any[]) =>
          arr.map(d => (d.id === deviceId ? { ...d, ...updates } : d));
        const newTract = {
          ...t,
          sourceDevices: updateArray(t.sourceDevices),
          sinkDevices: updateArray(t.sinkDevices),
          matrixDevices: updateArray(t.matrixDevices),
        };
        return recalc(newTract);
      })
    );
  }, [recalc]);

  const deleteTract = useCallback((id: string) => {
    setTracts(prev => prev.filter(t => t.id !== id));
    if (activeTractId === id) {
      setActiveTractId(null);
    }
  }, [activeTractId]);

  return {
    tracts,
    activeTractId,
    showAll,
    setShowAll,
    recalcAll,
    addTract,
    renameTract,
    addDevice,
    removeDevice,
    updateDevice,
    deleteTract,
    setActiveTractId,
  };
};
