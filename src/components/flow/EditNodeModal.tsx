// src/components/flow/EditNodeModal.tsx
import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { DeviceNodeData, DeviceInterface, PowerSupply } from '../../types/flowTypes';

interface EditNodeModalProps {
  isOpen: boolean;
  node: Node<DeviceNodeData> | null;
  onClose: () => void;
  onSave: (data: Partial<DeviceNodeData>) => void;
}

const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, node, onClose, onSave }) => {
  const [localData, setLocalData] = useState<Partial<DeviceNodeData>>({});
  const [newInputName, setNewInputName] = useState('');
  const [newOutputName, setNewOutputName] = useState('');
  const [newInputConnector, setNewInputConnector] = useState('HDMI');
  const [newOutputConnector, setNewOutputConnector] = useState('HDMI');
  const [newInputProtocol, setNewInputProtocol] = useState('HDMI');
  const [newOutputProtocol, setNewOutputProtocol] = useState('HDMI');

  useEffect(() => {
    if (node) {
      setLocalData({
        label: node.data.label || '',
        icon: node.data.icon || 'fas fa-microchip',
        color: node.data.color || '#2563eb',
        borderWidth: node.data.borderWidth ?? 1,
        borderRadius: node.data.borderRadius ?? 8,
        headerFontSize: node.data.headerFontSize ?? 10,
        portFontSize: node.data.portFontSize ?? 6,
        rowHeight: node.data.rowHeight ?? 22,
        inputs: node.data.inputs || [],
        outputs: node.data.outputs || [],
        powerSupply: node.data.powerSupply || { voltage: 'AC', power: 0, connector: 'IEC' },
        totalPoEConsumption: node.data.totalPoEConsumption ?? 0,
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

  const addInput = () => {
    if (!newInputName.trim()) return;
    const newInput: DeviceInterface = {
      id: `in-${Date.now()}-${newInputName}`,
      name: newInputName,
      direction: 'input',
      connector: newInputConnector,
      protocol: newInputProtocol,
    };
    setLocalData({
      ...localData,
      inputs: [...(localData.inputs || []), newInput],
    });
    setNewInputName('');
  };

  const addOutput = () => {
    if (!newOutputName.trim()) return;
    const newOutput: DeviceInterface = {
      id: `out-${Date.now()}-${newOutputName}`,
      name: newOutputName,
      direction: 'output',
      connector: newOutputConnector,
      protocol: newOutputProtocol,
    };
    setLocalData({
      ...localData,
      outputs: [...(localData.outputs || []), newOutput],
    });
    setNewOutputName('');
  };

  const removeInput = (id: string) => {
    setLocalData({
      ...localData,
      inputs: (localData.inputs || []).filter(i => i.id !== id),
    });
  };

  const removeOutput = (id: string) => {
    setLocalData({
      ...localData,
      outputs: (localData.outputs || []).filter(o => o.id !== id),
    });
  };

  const updatePowerSupply = (key: keyof PowerSupply, value: string | number) => {
    setLocalData({
      ...localData,
      powerSupply: { ...localData.powerSupply!, [key]: value },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-panel)',
        padding: 20,
        borderRadius: 16,
        width: 600,
        maxHeight: '85vh',
        overflow: 'auto',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Редактировать устройство</h3>

        {/* Основные настройки */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Название</label>
            <input
              type="text"
              value={localData.label || ''}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Иконка (FontAwesome)</label>
            <input
              type="text"
              value={localData.icon || ''}
              onChange={(e) => setLocalData({ ...localData, icon: e.target.value })}
              placeholder="fas fa-microchip"
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Цвет</label>
            <input
              type="color"
              value={localData.color || '#2563eb'}
              onChange={(e) => setLocalData({ ...localData, color: e.target.value })}
              style={{ width: '100%', height: 36 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Место размещения</label>
            <input
              type="text"
              value={localData.place || ''}
              onChange={(e) => setLocalData({ ...localData, place: e.target.value })}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6, background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Стилизация */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Обводка (px)</label>
            <input type="number" min="0" max="10" step="0.5" value={localData.borderWidth ?? 1} onChange={(e) => setLocalData({ ...localData, borderWidth: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Скругление (px)</label>
            <input type="number" min="0" max="30" value={localData.borderRadius ?? 8} onChange={(e) => setLocalData({ ...localData, borderRadius: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Высота строки (px)</label>
            <input type="number" min="12" max="40" value={localData.rowHeight ?? 22} onChange={(e) => setLocalData({ ...localData, rowHeight: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Размер заголовка (px)</label>
            <input type="number" min="8" max="24" value={localData.headerFontSize ?? 10} onChange={(e) => setLocalData({ ...localData, headerFontSize: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Размер портов (px)</label>
            <input type="number" min="4" max="16" value={localData.portFontSize ?? 6} onChange={(e) => setLocalData({ ...localData, portFontSize: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
        </div>

        {/* Питание */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Питание</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Напряжение</label>
              <select value={localData.powerSupply?.voltage || 'AC'} onChange={(e) => updatePowerSupply('voltage', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}>
                <option value="AC">AC</option>
                <option value="DC">DC</option>
                <option value="PoE">PoE</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Мощность (Вт)</label>
              <input type="number" min="0" value={localData.powerSupply?.power || 0} onChange={(e) => updatePowerSupply('power', Number(e.target.value))} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Разъём питания</label>
              <input type="text" value={localData.powerSupply?.connector || ''} onChange={(e) => updatePowerSupply('connector', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Потребление PoE (Вт)</label>
            <input type="number" min="0" value={localData.totalPoEConsumption ?? 0} onChange={(e) => setLocalData({ ...localData, totalPoEConsumption: Number(e.target.value) })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
          </div>
        </div>

        {/* Задержка видео */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Задержка видео (мс)</label>
          <input type="number" min="0" step="0.1" value={localData.videoLatencyMs ?? 0} onChange={(e) => setLocalData({ ...localData, videoLatencyMs: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
        </div>

        {/* Входы */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Входы</h4>
          {(localData.inputs || []).map((input) => (
            <div key={input.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{input.name} ({input.connector}/{input.protocol})</span>
              <button onClick={() => removeInput(input.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="text" placeholder="Название" value={newInputName} onChange={(e) => setNewInputName(e.target.value)} style={{ flex: 2, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
            <select value={newInputConnector} onChange={(e) => setNewInputConnector(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}>
              <option>HDMI</option><option>DisplayPort</option><option>DVI</option><option>VGA</option><option>RJ45</option><option>XLR</option><option>RCA</option><option>USB</option>
            </select>
            <select value={newInputProtocol} onChange={(e) => setNewInputProtocol(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}>
              <option>HDMI</option><option>DisplayPort</option><option>DVI</option><option>Ethernet</option><option>Dante</option><option>AES67</option><option>Аудио</option>
            </select>
            <button onClick={addInput} style={{ padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {/* Выходы */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <h4 style={{ fontSize: 14, marginBottom: 8 }}>Выходы</h4>
          {(localData.outputs || []).map((output) => (
            <div key={output.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{output.name} ({output.connector}/{output.protocol})</span>
              <button onClick={() => removeOutput(output.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="text" placeholder="Название" value={newOutputName} onChange={(e) => setNewOutputName(e.target.value)} style={{ flex: 2, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }} />
            <select value={newOutputConnector} onChange={(e) => setNewOutputConnector(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}>
              <option>HDMI</option><option>DisplayPort</option><option>DVI</option><option>VGA</option><option>RJ45</option><option>XLR</option><option>RCA</option><option>USB</option>
            </select>
            <select value={newOutputProtocol} onChange={(e) => setNewOutputProtocol(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 6 }}>
              <option>HDMI</option><option>DisplayPort</option><option>DVI</option><option>Ethernet</option><option>Dante</option><option>AES67</option><option>Аудио</option>
            </select>
            <button onClick={addOutput} style={{ padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>Отмена</button>
          <button onClick={handleSave} style={{ padding: '6px 16px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default EditNodeModal;
