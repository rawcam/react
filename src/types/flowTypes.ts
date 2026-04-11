import { Node, Edge } from 'reactflow';

export type ConnectorType =
  | 'HDMI' | 'DVI' | 'DisplayPort' | 'VGA'
  | 'RJ45' | 'XLR' | 'TRS' | 'RCA'
  | 'USB-C' | 'USB-A' | 'USB-B'
  | 'Phoenix3' | 'Phoenix5'
  | 'PowerCON' | 'IEC'
  | 'Optical' | 'BNC';

export type ProtocolType =
  | 'HDMI' | 'DVI' | 'DisplayPort' | 'VGA'
  | 'Ethernet' | 'Dante' | 'AES67' | 'AVB'
  | 'AnalogAudio' | 'AES3'
  | 'USB2' | 'USB3' | 'USB-C-AltDP'
  | 'Power' | 'PoE';

export interface DeviceInterface {
  id: string;
  name: string;
  direction: 'input' | 'output' | 'bidirectional';
  connector: ConnectorType;
  protocol: ProtocolType;
  poe?: boolean;
  poePower?: number;
  pins?: number;
}

export interface PowerSupply {
  voltage: 'AC' | 'DC';
  power: number;            // в ваттах
  connector?: 'IEC' | 'PowerCON' | 'USB' | 'Terminal'; // тип разъёма питания
}

export interface DeviceNodeData {
  label: string;
  manufacturer?: string;
  model?: string;
  icon: string;
  inputs: DeviceInterface[];
  outputs: DeviceInterface[];
  color?: string;
  width?: number;
  height?: number;
  totalPoEConsumption?: number;      // суммарное PoE (вычисляется автоматически)
  powerSupply?: PowerSupply;         // отдельно от входов/выходов
  // Визуальные настройки
  borderWidth?: number;
  borderRadius?: number;
  handleLength?: number;
  handleThickness?: number;
  handleOffset?: number;
  headerFontSize?: number;
  portFontSize?: number;
  headerFontWeight?: 'normal' | 'bold';
}

export interface CableEdgeData {
  cableType: string;
  sourceLabel: string;
  targetLabel: string;
  adapter?: string;
  length?: number;
  labelText?: string;                // если задано, отображается вместо автоматического текста
  // Стили бейджа
  badgeFontSize?: number;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  badgeBorderWidth?: number;
  badgeBorderRadius?: number;
  badgeBackgroundColor?: string;
}

export interface SavedSchema {
  id: string;
  name: string;
  nodes: Node<DeviceNodeData>[];
  edges: Edge<CableEdgeData>[];
}
