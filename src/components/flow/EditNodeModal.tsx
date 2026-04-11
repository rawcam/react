import React from 'react';
import { Node } from 'reactflow';
import { DeviceNodeData, DeviceInterface, ConnectorType, ProtocolType, PowerSupply } from '../../types/flowTypes';

interface EditNodeModalProps {
  isOpen: boolean;
  node: Node<DeviceNodeData> | null;
  onClose: () => void;
  onSave: (updatedData: Partial<DeviceNodeData>) => void;
}

const connectorOptions: ConnectorType[] = ['HDMI', 'DVI', 'DisplayPort', 'RJ45', 'XLR', 'Phoenix3', 'Phoenix5', 'USB-C', 'IEC', 'PowerCON'];
const protocolOptions: ProtocolType[] = ['HDMI', 'DVI', 'DisplayPort', 'Ethernet', 'Dante', 'AES67', 'AnalogAudio', 'Power', 'PoE'];

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
    newList[index] = { ...newList[index], [field]: value };
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1200px',
          minWidth: '800px',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'white',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Редактировать устройство</h3>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <label style={{ flex: 2 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Название устройства</span>
            <input
              value={editedData.label}
              onChange={e => setEditedData({ ...editedData, label: e.target.value })}
              style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Цвет</span>
            <input
              type="color"
              value={editedData.color || '#2563eb'}
              onChange={e => setEditedData({ ...editedData, color: e.target.value })}
              style={{ width: '100%', height: '34px', padding: '2px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Входы */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0 }}>Входы</h4>
              <button onClick={() => addInterface('inputs')} style={{ padding: '4px 10px' }}>+ Добавить</button>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Название</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Разъём</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Протокол</th>
                    <th style={{ padding: '6px', width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.inputs.map((iface, idx) => (
                    <tr key={iface.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px' }}>
                        <input
                          value={iface.name}
                          onChange={e => updateInterface('inputs', idx, 'name', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select
                          value={iface.connector}
                          onChange={e => updateInterface('inputs', idx, 'connector', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          {connectorOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select
                          value={iface.protocol}
                          onChange={e => updateInterface('inputs', idx, 'protocol', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          {protocolOptions.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button onClick={() => removeInterface('inputs', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {editedData.inputs.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Нет входов</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Выходы */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0 }}>Выходы</h4>
              <button onClick={() => addInterface('outputs')} style={{ padding: '4px 10px' }}>+ Добавить</button>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Название</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Разъём</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Протокол</th>
                    <th style={{ padding: '6px', width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.outputs.map((iface, idx) => (
                    <tr key={iface.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px' }}>
                        <input
                          value={iface.name}
                          onChange={e => updateInterface('outputs', idx, 'name', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select
                          value={iface.connector}
                          onChange={e => updateInterface('outputs', idx, 'connector', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          {connectorOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <select
                          value={iface.protocol}
                          onChange={e => updateInterface('outputs', idx, 'protocol', e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          {protocolOptions.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button onClick={() => removeInterface('outputs', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {editedData.outputs.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Нет выходов</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Секция питания */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Питание устройства</h4>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '12px' }}>Тип питания</span>
              <select
                value={editedData.powerSupply ? 'external' : 'none'}
                onChange={(e) => {
                  if (e.target.value === 'none') {
                    setEditedData({ ...editedData, powerSupply: undefined });
                  } else {
                    updatePowerSupply('voltage', 'AC');
                  }
                }}
                style={{ width: '100%', padding: '6px' }}
              >
                <option value="none">Нет (PoE или не требуется)</option>
                <option value="external">Внешнее питание</option>
              </select>
            </label>
            {editedData.powerSupply && (
              <>
                <label style={{ width: '100px' }}>
                  <span style={{ fontSize: '12px' }}>Напряжение</span>
                  <select
                    value={editedData.powerSupply.voltage}
                    onChange={e => updatePowerSupply('voltage', e.target.value)}
                    style={{ width: '100%', padding: '6px' }}
                  >
                    <option value="AC">AC</option>
                    <option value="DC">DC</option>
                  </select>
                </label>
                <label style={{ width: '120px' }}>
                  <span style={{ fontSize: '12px' }}>Мощность (Вт)</span>
                  <input
                    type="number"
                    min="0"
                    value={editedData.powerSupply.power}
                    onChange={e => updatePowerSupply('power', Number(e.target.value))}
                    style={{ width: '100%', padding: '6px' }}
                  />
                </label>
                <label style={{ width: '150px' }}>
                  <span style={{ fontSize: '12px' }}>Разъём</span>
                  <select
                    value={editedData.powerSupply.connector || ''}
                    onChange={e => updatePowerSupply('connector', e.target.value || undefined)}
                    style={{ width: '100%', padding: '6px' }}
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

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px' }}>Отмена</button>
          <button onClick={handleSave} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default EditNodeModal;
