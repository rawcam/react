import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizeControl, useReactFlow } from '@xyflow/react';
import { DeviceNodeData } from '../../types/flowTypes';

interface SwitchPort {
  number: number;
  type: 'rj45' | 'sfp';
  poe: boolean;
  used: boolean;
}

const DeviceNode = ({ id, data, selected }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const borderColor = data.color || '#2563eb';
  const { setNodes } = useReactFlow();

  const d = data as DeviceNodeData;
  const borderWidth = d.borderWidth ?? 1;
  const borderRadius = d.borderRadius ?? 8;
  const headerFontSize = d.headerFontSize ?? 10;
  const portFontSize = d.portFontSize ?? 6;
  const headerFontWeight = d.headerFontWeight ?? 'normal';

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

  const isNetworkSwitch = d.deviceType === 'network_switch';
  const switchConfig = d.networkSwitchConfig || { numPorts: 24, poePorts: 0, sfpPorts: 0, speed: '1G', portLayout: 'odd_left' };

  const totalPoE = d.totalPoEConsumption ?? 0;
  const maxRows = isNetworkSwitch ? 0 : Math.max(d.inputs.length, d.outputs.length);

  const handleLeftOffset = 12 + borderWidth + 8;
  const handleRightOffset = 12 + borderWidth + 8;
  const powerSupply = d.powerSupply;

  // Рендер портов в компактном виде, в стиле обычной ноды
  const renderSwitchPorts = () => {
    const ports: SwitchPort[] = [];
    const numPorts = switchConfig.numPorts;
    const poePorts = switchConfig.poePorts;
    const sfpPorts = switchConfig.sfpPorts;

    for (let i = 1; i <= numPorts; i++) {
      ports.push({
        number: i,
        type: 'rj45',
        poe: i <= poePorts,
        used: false,
      });
    }
    for (let i = 1; i <= sfpPorts; i++) {
      ports.push({
        number: numPorts + i,
        type: 'sfp',
        poe: false,
        used: false,
      });
    }

    // Группируем порты по 8 штук в ряд
    const rows: SwitchPort[][] = [];
    for (let i = 0; i < ports.length; i += 8) {
      rows.push(ports.slice(i, i + 8));
    }

    return (
      <div style={{ padding: '8px 12px 4px 12px' }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            {row.map(port => (
              <div
                key={port.number}
                style={{
                  width: '22px',
                  height: '16px',
                  background: port.used ? borderColor : (port.poe ? '#10b981' : 'var(--border-light)'),
                  color: port.used || port.poe ? 'white' : 'var(--text-secondary)',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 500,
                  border: port.used ? 'none' : `1px solid var(--border-light)`,
                }}
                title={`${port.type === 'sfp' ? 'SFP' : 'RJ45'} ${port.number}${port.poe ? ' PoE' : ''}`}
              >
                {port.type === 'sfp' ? 'S' : port.number}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'var(--bg-panel, white)',
        border: `${borderWidth}px solid ${borderColor}`,
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
          gap: 6,
          borderBottom: '1px solid var(--border-light)',
          padding: '0 12px 4px 12px',
        }}
      >
        <i className={d.icon} style={{ fontSize: 14, width: 16 }}></i>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
          {d.label}
        </span>
      </div>

      {isNetworkSwitch ? (
        renderSwitchPorts()
      ) : (
        <div style={{ fontSize: portFontSize, textTransform: 'uppercase', lineHeight: 1.4, padding: '0 12px' }}>
          {Array.from({ length: maxRows }).map((_, rowIndex) => {
            const input = d.inputs[rowIndex];
            const output = d.outputs[rowIndex];
            return (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: 22,
                  position: 'relative',
                }}
              >
                <div style={{ flex: 1, textAlign: 'left', position: 'relative' }}>
                  {input && (
                    <>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {input.name}
                      </span>
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={input.id}
                        style={{
                          background: borderColor,
                          top: `${((rowIndex + 0.5) / maxRows) * 100}%`,
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
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={output.id}
                        style={{
                          background: borderColor,
                          top: `${((rowIndex + 0.5) / maxRows) * 100}%`,
                          right: -handleRightOffset,
                          transform: 'translateY(-50%)',
                          width: 8,
                          height: 1,
                          borderRadius: 0,
                          border: 'none',
                        }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {output.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {totalPoE > 0 && !powerSupply && !isNetworkSwitch && (
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
