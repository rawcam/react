import React from 'react';
import { Node } from 'reactflow';
import { DeviceNodeData, DeviceInterface, ConnectorType, ProtocolType } from '../../types/flowTypes';

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

  const handleSave = () => {
    const totalPower = [...editedData.inputs, ...editedData.outputs].reduce((sum, iface) => sum + (iface.power || 0), 0);
    const totalPoE = [...editedData.inputs, ...editedData.outputs].reduce((sum, iface) => sum + (iface.poePower || 0), 0);
    onSave({ ...editedData, totalPowerConsumption: totalPower, totalPoEConsumption: totalPoE });
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
                    <th style={{ padding: '6px', textAlign: 'left' }}>PoE</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Мощн. (Вт)</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>AC/DC</th>
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
                        {iface.connector === 'RJ45' && (
                          <input
                            type="checkbox"
                            checked={iface.poe || false}
                            onChange={e => updateInterface('inputs', idx, 'poe', e.target.checked)}
                          />
                        )}
                      </td>
                      <td style={{ padding: '4px' }}>
                        {(iface.connector === 'RJ45' && iface.poe) || iface.connector === 'IEC' || iface.connector === 'PowerCON' || iface.protocol === 'Power' ? (
                          <input
                            type="number"
                            value={iface.poe ? iface.poePower || '' : iface.power || ''}
                            onChange={e => {
                              const val = Number(e.target.value);
                              if (iface.poe) updateInterface('inputs', idx, 'poePower', val);
                              else updateInterface('inputs', idx, 'power', val);
                            }}
                            style={{ width: '70px', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            placeholder="Вт"
                          />
                        ) : null}
                      </td>
                      <td style={{ padding: '4px' }}>
                        {(iface.connector === 'IEC' || iface.connector === 'PowerCON' || iface.protocol === 'Power') && !iface.poe && (
                          <select
                            value={iface.voltage || 'AC'}
                            onChange={e => updateInterface('inputs', idx, 'voltage', e.target.value)}
                            style={{ width: '70px', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button onClick={() => removeInterface('inputs', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {editedData.inputs.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Нет входов</td></tr>
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
                    <th style={{ padding: '6px', textAlign: 'left' }}>PoE</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Мощн. (Вт)</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>AC/DC</th>
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
                        {iface.connector === 'RJ45' && (
                          <input
                            type="checkbox"
                            checked={iface.poe || false}
                            onChange={e => updateInterface('outputs', idx, 'poe', e.target.checked)}
                          />
                        )}
                      </td>
                      <td style={{ padding: '4px' }}>
                        {(iface.connector === 'RJ45' && iface.poe) || iface.connector === 'IEC' || iface.connector === 'PowerCON' || iface.protocol === 'Power' ? (
                          <input
                            type="number"
                            value={iface.poe ? iface.poePower || '' : iface.power || ''}
                            onChange={e => {
                              const val = Number(e.target.value);
                              if (iface.poe) updateInterface('outputs', idx, 'poePower', val);
                              else updateInterface('outputs', idx, 'power', val);
                            }}
                            style={{ width: '70px', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            placeholder="Вт"
                          />
                        ) : null}
                      </td>
                      <td style={{ padding: '4px' }}>
                        {(iface.connector === 'IEC' || iface.connector === 'PowerCON' || iface.protocol === 'Power') && !iface.poe && (
                          <select
                            value={iface.voltage || 'AC'}
                            onChange={e => updateInterface('outputs', idx, 'voltage', e.target.value)}
                            style={{ width: '70px', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button onClick={() => removeInterface('outputs', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {editedData.outputs.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Нет выходов</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
