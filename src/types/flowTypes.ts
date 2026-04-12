// src/types/flowTypes.ts
import type { Node, Edge } from '@xyflow/react';

export type ConnectorType = ... // без изменений
export type ProtocolType = ... // без изменений
export const CONNECTOR_PROTOCOL_MAP = ... // без изменений

export interface DeviceInterface { ... }
export interface PowerSupply { ... }
export type DeviceType = 'generic' | 'extender' | 'matrix' | 'network_switch';

export interface NetworkSwitchConfig {
  numPorts: number;
  poePorts: number;
  sfpPorts: number;
  speed: '100M' | '1G' | '2.5G' | '10G';
  portLayout: 'odd_left' | 'odd_right';
  rj45NameTemplate?: string;   // шаблон названия RJ45
  sfpNameTemplate?: string;    // шаблон названия SFP
  highlightPorts?: boolean;    // подсвечивать фоном
}

export interface DeviceNodeData { ... } // без изменений
export interface CableEdgeData { ... }
export interface SavedSchema { ... }
