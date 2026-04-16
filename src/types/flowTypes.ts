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
  connector: string;
}

export interface DeviceNodeData {
  [key: string]: unknown; // ← индексная сигнатура для совместимости с Record<string, unknown>
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
}

export interface CableEdgeData {
  [key: string]: unknown; // ← индексная сигнатура
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
