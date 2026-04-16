// src/types/flowTypes.ts

export interface DeviceInterface {
  id: string;
  name: string;
  direction: 'input' | 'output' | 'bidirectional';
  connector: string;
  protocol: string;
  poe?: boolean;
  poePower?: number;
}

export interface PowerSupply {
  voltage: string;
  power: number;
  connector?: string;
}

export type DeviceType = 'generic' | 'extender' | 'matrix' | 'network_switch';

export interface NetworkSwitchConfig {
  numPorts: number;
  poePorts: number;
  sfpPorts: number;
  speed: '100M' | '1G' | '2.5G' | '10G';
  portLayout: 'odd_left' | 'odd_right';
  rj45NameTemplate?: string;
  sfpNameTemplate?: string;
  highlightPorts?: boolean;
}

export interface DeviceNodeData {
  [key: string]: unknown;
  label: string;
  icon?: string;
  inputs: DeviceInterface[];
  outputs: DeviceInterface[];
  color?: string;
  borderWidth?: number;
  borderRadius?: number;
  headerFontSize?: number;
  portFontSize?: number;
  headerFontWeight?: 'normal' | 'bold';
  rowHeight?: number;
  width?: number;
  height?: number;
  powerSupply?: PowerSupply;
  totalPoEConsumption?: number;
  place?: string;
  videoLatencyMs?: number;
  showHandleHover?: boolean;
  deviceType?: DeviceType;
  networkSwitchConfig?: NetworkSwitchConfig;
}

// ... остальные типы (CableEdgeData, SavedSchema)
