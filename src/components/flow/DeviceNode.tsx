import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl, useReactFlow } from 'reactflow';
import { DeviceNodeData } from '../../types/flowTypes';

const DeviceNode = ({ id, data, selected }: NodeProps<DeviceNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const borderColor = data.color || '#2563eb';
  const { setNodes } = useReactFlow();

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
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            zIndex: 10,
          }}
          className="nodrag"
        />
      )}

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
  background: 'white',
  border: `1px solid ${borderColor}`,
  borderRadius: 8,
  padding: '8px 0 4px 0',
  width: 'fit-content',          // ← вместо minWidth и width: data.width
  minWidth: 180,                 // ← оставляем, чтобы не сжималось слишком сильно
  boxShadow: selected ? '0 0 0 2px #2563eb' : 'none',
  cursor: 'grab',
  position: 'relative',
  fontFamily: 'Inter, sans-serif',
}}
    >
      {/* ЗАГОЛОВОК */}
      <div
        style={{
          fontWeight: 'normal',
          fontSize: 10,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderBottom: '1px solid #e2e8f0',
          padding: '0 12px 4px 12px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <i className={data.icon} style={{ fontSize: 14, width: 16 }}></i>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
          {data.label}
        </span>
      </div>

      {/* ПОРТЫ */}
      <div style={{ fontSize: 6, textTransform: 'uppercase', lineHeight: 1.4, color: '#334155', padding: '0 12px', fontFamily: 'Inter, sans-serif' }}>
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
                        width: 8,
                        height: 1,
                        top: `${((rowIndex + 0.5) / maxRows) * 100}%`,
                        left: -27,
                        transform: 'translateY(-50%)',
                        border: 'none',
                        borderRadius: 0,
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
                        width: 8,
                        height: 1,
                        top: `${((rowIndex + 0.5) / maxRows) * 100}%`,
                        right: -27,
                        transform: 'translateY(-50%)',
                        border: 'none',
                        borderRadius: 0,
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

      {/* ПИТАНИЕ */}
      {powerInterface && (
        <div
          style={{
            marginTop: 6,
            fontSize: 6,
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            padding: '4px 12px 0 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span>🔌 {powerInterface.voltage || 'AC'}</span>
          {powerInterface.power && <span>{powerInterface.power} Вт</span>}
        </div>
      )}

      {/* PoE */}
      {totalPoE > 0 && !powerInterface && (
        <div
          style={{
            marginTop: 6,
            fontSize: 6,
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            padding: '4px 12px 0 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span>🌐 PoE {totalPoE} Вт</span>
        </div>
      )}

      <NodeResizeControl
        nodeId={id}
        minWidth={180}
        minHeight={80}
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
            top: 10,
            left: 32,
            width: 'calc(100% - 60px)',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 'inherit',
            zIndex: 10,
          }}
          className="nodrag"
        />
      )}
    </div>
  );
};

export default DeviceNode;
