import React from 'react';
import { Node } from '@xyflow/react';
import { DeviceNodeData, DeviceInterface, ConnectorType, ProtocolType, PowerSupply, CONNECTOR_PROTOCOL_MAP } from '../../types/flowTypes';

interface EditNodeModalProps {
  isOpen: boolean;
  node: Node<DeviceNodeData> | null;
  onClose: () => void;
  onSave: (updatedData: Partial<DeviceNodeData>) => void;
}

const connectorOptions: ConnectorType[] = Object.keys(CONNECTOR_PROTOCOL_MAP) as ConnectorType[];

const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, node, onClose, onSave }) => {
  const [editedData, setEditedData] = React.useState<DeviceNodeData | null>(null);

  React.useEffect(() => {
    if (node) {
      setEditedData({ ...node.data });
    }
  }, [node]);

  if (!isOpen || !editedData) return null;

  const updateInterface = (type: 'inputs' | 'outputs', index: number, field: keyof DeviceInterface, value: any) => {
    const newList = [...editedData[type]];
    const current = newList[index];
    
    if (field === 'connector') {
      // При смене разъёма сбрасываем протокол на первый доступный
      const allowedProtocols = CONNECTOR_PROTOCOL_MAP[value as ConnectorType];
      current.connector = value;
      current.protocol = allowedProtocols[0];
    } else {
      current[field] = value;
    }
    
    newList[index] = current;
    setEditedData({ ...editedData, [type]: newList });
  };

  const addInterface = (type: 'inputs' | 'outputs') => {
    const newId = `${type}-${Date.now()}-${Math.random()}`;
    const newIf: DeviceInterface = {
      id: newId,
      name: type === 'inputs' ? `Вход ${editedData.inputs.length + 1}` : `Выход ${editedData.outputs.length + 1}`,
      direction: type === 'inputs' ? 'input' : 'output',
      connector: 'HDMI',
      protocol: 'HDMI',
    };
    setEditedData({ ...editedData, [type]: [...editedData[type], newIf] });
  };

  const removeInterface = (type: 'inputs' | 'outputs', index: number) => {
    const newList = editedData[type].filter((_, i) => i !== index);
    setEditedData({ ...editedData, [type]: newList });
  };

  const updatePowerSupply = (field: keyof PowerSupply, value: any) => {
    const current = editedData.powerSupply || { voltage: 'AC', power: 0 };
    const updated = { ...current, [field]: value };
    setEditedData({ ...editedData, powerSupply: updated });
  };

  const handleSave = () => {
    const totalPoE = [...editedData.inputs, ...editedData.outputs].reduce((sum, iface) => sum + (iface.poePower || 0), 0);
    onSave({ ...editedData, totalPoEConsumption: totalPoE });
    onClose();
  };

  const renderTable = (type: 'inputs' | 'outputs') => {
    const list = editedData[type];
    const title = type === 'inputs' ? 'Входы' : 'Выходы';
    return (
      <div style={{ flex: 1, background: 'var(--card-bg, #f9fcff)', borderRadius: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h4>
          <button
            onClick={() => addInterface(type)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + Добавить
          </button>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)' }}>Название</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)' }}>Разъём</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)' }}>Протокол</th>
                <th style={{ padding: '8px 4px', width: '30px' }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((iface: DeviceInterface, idx: number) => {
                const allowedProtocols = CONNECTOR_PROTOCOL_MAP[iface.connector] || [];
                return (
                  <tr key={iface.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '4px' }}>
                      <input
                        value={iface.name}
                        onChange={e => updateInterface(type, idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '13px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          background: 'var(--bg-panel)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <select
                        value={iface.connector}
                        onChange={e => updateInterface(type, idx, 'connector', e.target.value as ConnectorType)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '13px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          background: 'var(--bg-panel)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {connectorOptions.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '4px' }}>
                      <select
                        value={iface.protocol}
                        onChange={e => updateInterface(type, idx, 'protocol', e.target.value as ProtocolType)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '13px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          background: 'var(--bg-panel)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {allowedProtocols.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '4px', textAlign: 'center' }}>
                      <button
                        onClick={() => removeInterface(type, idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          fontSize: '16px',
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Нет {type === 'inputs' ? 'входов' : 'выходов'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1000px',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'var(--bg-panel)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow)',
          color: 'var(--text-primary)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 600 }}>Редактировать устройство</h3>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <label style={{ flex: 2 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Название устройства</span>
            <input
              value={editedData.label}
              onChange={e => setEditedData({ ...editedData, label: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
              }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Цвет</span>
            <input
              type="color"
              value={editedData.color || '#2563eb'}
              onChange={e => setEditedData({ ...editedData, color: e.target.value })}
              style={{ width: '100%', height: '44px', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {renderTable('inputs')}
          {renderTable('outputs')}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', fontWeight: 500 }}>Питание устройства</h4>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Тип питания</span>
              <select
                value={editedData.powerSupply ? 'external' : 'none'}
                onChange={(e) => {
                  if (e.target.value === 'none') {
                    setEditedData({ ...editedData, powerSupply: undefined });
                  } else {
                    updatePowerSupply('voltage', 'AC');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-panel)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="none">Нет (PoE или не требуется)</option>
                <option value="external">Внешнее питание</option>
              </select>
            </label>
            {editedData.powerSupply && (
              <>
                <label style={{ width: '100px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Напряжение</span>
                  <select
                    value={editedData.powerSupply.voltage}
                    onChange={e => updatePowerSupply('voltage', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="AC">AC</option>
                    <option value="DC">DC</option>
                  </select>
                </label>
                <label style={{ width: '120px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Мощность (Вт)</span>
                  <input
                    type="number"
                    min="0"
                    value={editedData.powerSupply.power}
                    onChange={e => updatePowerSupply('power', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                <label style={{ width: '150px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Разъём</span>
                  <select
                    value={editedData.powerSupply.connector || ''}
                    onChange={e => updatePowerSupply('connector', e.target.value || undefined)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-panel)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">Не указан</option>
                    <option value="IEC">IEC</option>
                    <option value="PowerCON">PowerCON</option>
                    <option value="USB">USB</option>
                    <option value="Terminal">Клемма</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNodeModal;
