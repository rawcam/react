// src/components/flow/EditNodeModal.tsx
import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { DeviceNodeData } from '../../types/flowTypes';

interface EditNodeModalProps {
  isOpen: boolean;
  node: Node<DeviceNodeData> | null;
  onClose: () => void;
  onSave: (data: Partial<DeviceNodeData>) => void;
}

const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, node, onClose, onSave }) => {
  const [localData, setLocalData] = useState<Partial<DeviceNodeData>>({});

  useEffect(() => {
    if (node) {
      setLocalData({
        label: node.data.label || '',
        color: node.data.color || '#2563eb',
        borderWidth: node.data.borderWidth ?? 1,
        borderRadius: node.data.borderRadius ?? 8,
        headerFontSize: node.data.headerFontSize ?? 10,
        portFontSize: node.data.portFontSize ?? 6,
        rowHeight: node.data.rowHeight ?? 22,
        place: node.data.place || '',
        videoLatencyMs: node.data.videoLatencyMs ?? 0,
      });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(localData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-panel)',
        padding: 20,
        borderRadius: 16,
        width: 400,
        maxHeight: '80vh',
        overflow: 'auto',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Редактировать устройство</h3>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Название</label>
          <input
            type="text"
            value={localData.label || ''}
            onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Место размещения</label>
          <input
            type="text"
            value={localData.place || ''}
            onChange={(e) => setLocalData({ ...localData, place: e.target.value })}
            style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Цвет</label>
          <input
            type="color"
            value={localData.color || '#2563eb'}
            onChange={(e) => setLocalData({ ...localData, color: e.target.value })}
            style={{ width: '100%', height: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Толщина обводки</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={localData.borderWidth ?? 1}
              onChange={(e) => setLocalData({ ...localData, borderWidth: Number(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Скругление</label>
            <input
              type="number"
              min="0"
              max="30"
              value={localData.borderRadius ?? 8}
              onChange={(e) => setLocalData({ ...localData, borderRadius: Number(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Размер заголовка</label>
            <input
              type="number"
              min="8"
              max="24"
              value={localData.headerFontSize ?? 10}
              onChange={(e) => setLocalData({ ...localData, headerFontSize: Number(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Размер портов</label>
            <input
              type="number"
              min="4"
              max="16"
              value={localData.portFontSize ?? 6}
              onChange={(e) => setLocalData({ ...localData, portFontSize: Number(e.target.value) })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Высота строки (px)</label>
          <input
            type="number"
            min="12"
            max="40"
            value={localData.rowHeight ?? 22}
            onChange={(e) => setLocalData({ ...localData, rowHeight: Number(e.target.value) })}
            style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Задержка видео (мс)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={localData.videoLatencyMs ?? 0}
            onChange={(e) => setLocalData({ ...localData, videoLatencyMs: parseFloat(e.target.value) || 0 })}
            style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>Отмена</button>
          <button onClick={handleSave} style={{ padding: '6px 16px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default EditNodeModal;
