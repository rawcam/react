// src/components/flow/DeviceNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DeviceNodeData } from '../../types/flowTypes';

const DeviceNode: React.FC<NodeProps<DeviceNodeData>> = ({ data, selected }) => {
  const {
    label,
    icon = 'fas fa-microchip',
    inputs = [],
    outputs = [],
    color = '#2563eb',
    borderWidth = 1,
    borderRadius = 8,
    headerFontSize = 10,
    portFontSize = 6,
    headerFontWeight = 'normal',
    rowHeight = 22,
    showHandleHover = false,
    width: nodeWidthProp,
    powerSupply,
    videoLatencyMs,
  } = data;

  const maxRows = Math.max(inputs.length, outputs.length);
  const headerHeight = 36;
  const footerHeight = 20;
  const nodeHeight = headerHeight + maxRows * rowHeight + footerHeight;
  const nodeWidth = nodeWidthProp || 90;

  const handleClass = showHandleHover ? 'handle-hover-visible' : '';

  return (
    <div
      style={{
        width: nodeWidth,
        height: nodeHeight,
        background: 'var(--bg-panel)',
        border: `${borderWidth}px solid ${color}`,
        borderRadius: `${borderRadius}px`,
        boxShadow: selected ? '0 0 0 2px rgba(59,130,246,0.5)' : 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: headerHeight,
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 6,
          fontSize: headerFontSize,
          fontWeight: headerFontWeight,
        }}
      >
        <i className={icon} style={{ fontSize: headerFontSize + 2 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          {inputs.map((port) => (
            <div
              key={port.id}
              style={{
                height: rowHeight,
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={port.id}
                className={handleClass}
                style={{
                  position: 'absolute',
                  left: -1,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 8,
                  height: 1,
                  background: color,
                  border: 'none',
                  borderRadius: 0,
                }}
              />
              <span
                style={{
                  fontSize: portFontSize,
                  color: 'var(--text-primary)',
                  marginLeft: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {port.name}
              </span>
            </div>
          ))}
        </div>

        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {outputs.map((port) => (
            <div
              key={port.id}
              style={{
                height: rowHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                className={handleClass}
                style={{
                  position: 'absolute',
                  right: -1,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 8,
                  height: 1,
                  background: color,
                  border: 'none',
                  borderRadius: 0,
                }}
              />
              <span
                style={{
                  fontSize: portFontSize,
                  color: 'var(--text-primary)',
                  marginRight: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {port.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          height: footerHeight,
          borderTop: `1px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 8px',
          fontSize: 8,
          color: 'var(--text-secondary)',
        }}
      >
        {powerSupply && (
          <span>
            {powerSupply.voltage} {powerSupply.power}W
          </span>
        )}
        {videoLatencyMs ? (
          <span style={{ marginLeft: 8 }}>⏱️ {videoLatencyMs}ms</span>
        ) : null}
      </div>
    </div>
  );
};

export default memo(DeviceNode);
