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

export interface CableEdgeData {
  [key: string]: unknown;
  cableType?: string;
  sourceLabel?: string;
  targetLabel?: string;
  sourceLabelText?: string;
  targetLabelText?: string;
  labelText?: string;
  adapter?: string;
  edgeStrokeColor?: string;
  edgeStrokeWidth?: number;
  edgeBorderRadius?: number;
  badgeFontSize?: number;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  badgeBorderWidth?: number;
  badgeBorderRadius?: number;
  badgeBackgroundColor?: string;
  markerFontSize?: number;
  markerTextColor?: string;
  markerBorderColor?: string;
  markerBorderWidth?: number;
  markerBorderRadius?: number;
  markerBackgroundColor?: string;
  hideMainBadge?: boolean;
  hideMarkers?: boolean;
  cableLength?: number;
  cableMark?: string;
}

export interface SavedSchema {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
}

export type ConnectorType = 
  | 'HDMI' | 'DisplayPort' | 'DVI' | 'VGA' 
  | 'RJ45' | 'XLR' | 'RCA' | 'TRS' | 'USB' 
  | 'Speakon' | 'Db9' | 'Db25' | 'Optical' | 'BNC';

export type ProtocolType = 
  | 'HDMI' | 'DisplayPort' | 'DVI' | 'VGA' 
  | 'Ethernet' | 'Dante' | 'AES67' | 'AVB'
  | 'HDBaseT' | 'AVoIP' | 'SDVoE'
  | 'RS-232' | 'RS-485' | 'Аудио' | 'MIDI' | 'USB';

export const CONNECTOR_PROTOCOL_MAP: Record<ConnectorType, ProtocolType[]> = {
  'HDMI': ['HDMI'],
  'DisplayPort': ['DisplayPort'],
  'DVI': ['DVI'],
  'VGA': ['VGA'],
  'RJ45': ['Ethernet', 'Dante', 'AES67', 'AVB', 'HDBaseT', 'AVoIP', 'SDVoE'],
  'XLR': ['Аудио'],
  'RCA': ['Аудио'],
  'TRS': ['Аудио'],
  'USB': ['USB'],
  'Speakon': ['Аудио'],
  'Db9': ['RS-232', 'RS-485'],
  'Db25': ['RS-232', 'MIDI'],
  'Optical': ['Аудио'],
  'BNC': ['Аудио', 'HDMI'],
};
