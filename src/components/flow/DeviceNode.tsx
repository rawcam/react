import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow } from 'reactflow';
import { DeviceNodeData } from '../../types/flowTypes';

const DeviceNode = ({ id, data, selected }: NodeProps<DeviceNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const borderColor = data.color || '#2563eb';
  const { setNodes } = useReactFlow();

  const borderWidth = data.borderWidth ?? 1;
  const borderRadius = data.borderRadius ?? 8;
  const headerFontSize = data.headerFontSize ?? 10;
  const portFontSize = data.portFontSize ?? 6;
  const headerFontWeight = data.headerFontWeight ?? 'normal';

  const handleLabelSubmit = () => {
    if (editLabel.trim()) data.label = editLabel;
    else setEditLabel(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLabelSubmit();
    else if (e.key === 'Escape') {
      setEditLabel(data.label);
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

  const powerInterface = [...data.inputs, ...data.outputs].find(
    (iface) =>
      (iface.connector === 'IEC' || iface.connector === 'PowerCON' || iface.protocol === 'Power') && !iface.poe
  );
  const totalPoE = data.totalPoEConsumption ?? 0;
  const maxRows = Math.max(data.inputs.length, data.outputs.length);

  return (
    <div
      style={{
        background: 'var(--bg-panel, white)',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        padding: '8px 0 4px 0',
        width: data.width || 'auto',
        minWidth: 90,
        height: data.height || 'auto',
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
        <i className={data.icon} style={{ fontSize: 14, width: 16 }}></i>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
          {data.label}
        </span>
      </div>

      <div style={{ fontSize: portFontSize, textTransform: 'uppercase', lineHeight: 1.4, padding: '0 12px' }}>
        {Array.from({ length: maxRows }).map((_, rowIndex) => {
          const input = data.inputs[rowIndex];
          const output = data.outputs[rowIndex];

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
                        left: -20,
                        transform: 'translateY(-50%)',
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
                        right: -20,
                        transform: 'translateY(-50%)',
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

      {powerInterface && (
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
          <span>🔌 {powerInterface.voltage || 'AC'}</span>
          {powerInterface.power && <span>{powerInterface.power} Вт</span>}
        </div>
      )}

      {totalPoE > 0 && !powerInterface && (
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
        color={borderColor}
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
