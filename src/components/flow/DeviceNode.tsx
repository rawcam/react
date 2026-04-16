// src/components/flow/DeviceNode.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizeControl, useReactFlow, NodeProps } from '@xyflow/react';
import { DeviceNodeData } from '../../types/flowTypes';

const DeviceNode: React.FC<NodeProps<DeviceNodeData>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const borderColor = data.color || '#2563eb';
  const { setNodes } = useReactFlow();

  const d = data;
  const borderWidth = d.borderWidth ?? 1;
  const borderRadius = d.borderRadius ?? 8;
  const headerFontSize = d.headerFontSize ?? 10;
  const portFontSize = d.portFontSize ?? 6;
  const headerFontWeight = d.headerFontWeight ?? 'normal';
  const rowHeight = d.rowHeight ?? 22;

  const handleLabelSubmit = () => {
    if (editLabel.trim()) d.label = editLabel;
    else setEditLabel(d.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLabelSubmit();
    else if (e.key === 'Escape') {
      setEditLabel(d.label);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleResize = (_event: any, params: { width: number; height: number }) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, width: params.width, height: params.height } } : n
      )
    );
  };

  const totalPoE = d.totalPoEConsumption ?? 0;
  const maxRows = Math.max(d.inputs.length, d.outputs.length);

  const handleLeftOffset = 12 + borderWidth + 8;
  const handleRightOffset = 12 + borderWidth + 8;
  const powerSupply = d.powerSupply;
  const iconClass = d.icon || 'fas fa-microchip';

  const isDarkTheme = document.documentElement.classList.contains('dark');
  let effectiveBorderColor = borderColor;
  if (isDarkTheme && (borderColor === '#000000' || borderColor === '#1e2b3c')) {
    effectiveBorderColor = '#e0e0e0';
  }

  const isNetworkSwitch = d.deviceType === 'network_switch';
  const highlightPorts = isNetworkSwitch && (d.networkSwitchConfig?.highlightPorts ?? true);

  const getPortStyle = (iface: any) => {
    if (!highlightPorts) return {};
    if (iface.poe) {
      return { background: '#10b981', color: 'white', padding: '0 4px', borderRadius: '4px' };
    }
    if (iface.name?.includes('SFP')) {
      return { background: '#475569', color: 'white', padding: '0 4px', borderRadius: '4px' };
    }
    return {};
  };

  return (
    <div
      style={{
        background: 'var(--bg-panel, white)',
        border: `${borderWidth}px solid ${effectiveBorderColor}`,
        borderRadius: `${borderRadius}px`,
        padding: '8px 0 4px 0',
        width: d.width || 'auto',
        minWidth: 90,
        height: d.height || 'auto',
        boxShadow: selected ? '0 0 0 2px #2563eb' : 'none',
        cursor: 'grab',
        position: 'relative',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          fontWeight: headerFontWeight,
          fontSize: headerFontSize,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          borderBottom: '1px solid var(--border-light)',
          padding: '0 12px 4px 12px',
        }}
      >
        <i className={iconClass} style={{ fontSize: 6, lineHeight: 1, verticalAlign: 'middle' }} />
        <span style={{ cursor: 'pointer', lineHeight: 1 }} onClick={() => setIsEditing(true)}>
          {d.label}
        </span>
      </div>

      <div style={{ fontSize: portFontSize, textTransform: 'uppercase', lineHeight: 1.4, padding: '0 12px' }}>
        {Array.from({ length: maxRows }).map((_, rowIndex) => {
          const input = d.inputs[rowIndex];
          const output = d.outputs[rowIndex];
          return (
            <div key={rowIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: rowHeight, position: 'relative' }}>
              <div style={{ flex: 1, textAlign: 'left', position: 'relative' }}>
                {input && (
                  <>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...getPortStyle(input) }}>
                      {input.name}
                    </span>
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={input.id}
                      style={{
                        background: effectiveBorderColor,
                        top: '50%',
                        left: -handleLeftOffset,
                        transform: 'translateY(-50%)',
                        width: 8,
                        height: 1,
                        borderRadius: 0,
                        border: 'none',
                      }}
                    />
                  </>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'right', position: 'relative' }}>
                {output && (
                  <>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...getPortStyle(output) }}>
                      {output.name}
                    </span>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={output.id}
                      style={{
                        background: effectiveBorderColor,
                        top: '50%',
                        right: -handleRightOffset,
                        transform: 'translateY(-50%)',
                        width: 8,
                        height: 1,
                        borderRadius: 0,
                        border: 'none',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {powerSupply && (
        <div
          style={{
            marginTop: 6,
            fontSize: portFontSize,
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-light)',
            padding: '4px 12px 0 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>🔌 {powerSupply.voltage} {powerSupply.power} Вт</span>
          {powerSupply.connector && <span>({powerSupply.connector})</span>}
        </div>
      )}

      {totalPoE > 0 && !powerSupply && (
        <div
          style={{
            marginTop: 6,
            fontSize: portFontSize,
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-light)',
            padding: '4px 12px 0 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>🌐 PoE {totalPoE} Вт</span>
        </div>
      )}

      <NodeResizeControl
        nodeId={id}
        minWidth={90}
        minHeight={40}
        maxWidth={800}
        maxHeight={600}
        keepAspectRatio={false}
        onResize={handleResize}
        style={{ background: 'transparent', border: 'none' }}
      />

      {isEditing && (
        <input
          ref={inputRef}
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleLabelSubmit}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 24px)',
            border: '1px solid var(--border-light)',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: headerFontSize,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            zIndex: 10,
            background: 'var(--bg-panel)',
            color: 'var(--text-primary)',
          }}
          className="nodrag"
        />
      )}
    </div>
  );
};

export default DeviceNode;
