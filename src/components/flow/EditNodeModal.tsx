// src/components/flow/EditNodeModal.tsx
import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { DeviceNodeData, DeviceInterface, ConnectorType, ProtocolType, PowerSupply, CONNECTOR_PROTOCOL_MAP, DeviceType, NetworkSwitchConfig } from '../../types/flowTypes';
import IconPickerModal from './IconPickerModal';

interface EditNodeModalProps {
  isOpen: boolean;
  node: Node<DeviceNodeData> | null;
  onClose: () => void;
  onSave: (updatedData: Partial<DeviceNodeData>) => void;
}

const connectorOptions: ConnectorType[] = Object.keys(CONNECTOR_PROTOCOL_MAP) as ConnectorType[];

const COLOR_PALETTE = [
  '#000000', '#ffffff',
  '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
];

// 🆕 Функция генерации имени порта по разъёму, протоколу и направлению
const generatePortName = (
  connector: ConnectorType,
  protocol: ProtocolType,
  direction: 'input' | 'output',
  existingPorts: DeviceInterface[]
): string => {
  // Определяем базовое имя (префикс)
  let baseName: string = connector; // по умолчанию берём разъём
  if (connector === 'RJ45') {
    // Для RJ45 используем протокол (кроме Ethernet -> LAN)
    if (protocol === 'Ethernet') baseName = 'LAN';
    else if (protocol === 'Dante') baseName = 'Dante';
    else if (protocol === 'AVoIP') baseName = 'AVoIP';
    else if (protocol === 'HDBaseT') baseName = 'HDBaseT';
    else if (protocol === 'AES67') baseName = 'AES67';
    else if (protocol === 'AVB') baseName = 'AVB';
    else baseName = protocol; // на всякий случай
  } else if (connector === 'Db9' || connector === 'Db25') {
    baseName = protocol === 'MIDI' ? 'MIDI' : 'RS-232';
  } else if (connector === 'Terminal') {
    baseName = 'Terminal';
  }

  // Направление: IN или OUT
  const dirStr = direction === 'input' ? 'IN' : 'OUT';

  // Собираем полный префикс: "HDMI IN", "Dante OUT" и т.д.
  const prefix = `${baseName} ${dirStr}`;

  // Ищем максимальный номер среди портов с таким же префиксом
  let maxNum = 0;
  existingPorts.forEach(port => {
    if (port.name.startsWith(prefix)) {
      const rest = port.name.substring(prefix.length).trim();
      const num = parseInt(rest, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  return `${prefix} ${maxNum + 1}`;
};

const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, node, onClose, onSave }) => {
  const [editedData, setEditedData] = useState<DeviceNodeData | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  React.useEffect(() => {
    if (node) {
      setEditedData({ ...node.data });
    }
  }, [node]);

  if (!isOpen || !editedData) return null;

  const deviceType = editedData.deviceType || 'generic';

  const updateInterface = (type: 'inputs' | 'outputs', index: number, field: keyof DeviceInterface, value: any) => {
    setEditedData(prev => {
      if (!prev) return prev;
      const newList = [...prev[type]];
      const current = { ...newList[index] };
      if (field === 'connector') {
        current.connector = value;
        current.protocol = CONNECTOR_PROTOCOL_MAP[value as ConnectorType][0];
        if (value !== 'RJ45') {
          current.poe = false;
          current.poePower = undefined;
        }
        // Имя не меняем, так как пользователь мог его задать вручную
      } else {
        (current as any)[field] = value;
      }
      newList[index] = current;
      return { ...prev, [type]: newList };
    });
  };

  const addInterface = (type: 'inputs' | 'outputs') => {
    const newId = `${type}-${Date.now()}-${Math.random()}`;
    const direction = type === 'inputs' ? 'input' : 'output';
    const defaultConnector: ConnectorType = 'HDMI';
    const defaultProtocol = CONNECTOR_PROTOCOL_MAP['HDMI'][0];

    // 🆕 Генерируем автоматическое имя на основе разъёма/протокола
    const allPorts = [...editedData.inputs, ...editedData.outputs];
    const autoName = generatePortName(defaultConnector, defaultProtocol, direction, allPorts);

    const newIf: DeviceInterface = {
      id: newId,
      name: autoName,
      direction,
      connector: defaultConnector,
      protocol: defaultProtocol,
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

  const updateSwitchConfig = (field: keyof NetworkSwitchConfig, value: any) => {
    const current = editedData.networkSwitchConfig || {
      numPorts: 24, poePorts: 0, sfpPorts: 0, speed: '1G', portLayout: 'odd_left',
      rj45NameTemplate: 'Порт {n}', sfpNameTemplate: 'SFP {n}', highlightPorts: true
    };
    setEditedData({ ...editedData, networkSwitchConfig: { ...current, [field]: value } });
  };

  const handleSave = () => {
    let updated: DeviceNodeData = { ...editedData };

    if (updated.deviceType === 'network_switch') {
      const cfg = updated.networkSwitchConfig || {
        numPorts: 24, poePorts: 0, sfpPorts: 0, speed: '1G', portLayout: 'odd_left',
        rj45NameTemplate: 'Порт {n}', sfpNameTemplate: 'SFP {n}', highlightPorts: true
      };
      const inputs: DeviceInterface[] = [];
      const outputs: DeviceInterface[] = [];
      const oddLeft = cfg.portLayout === 'odd_left';

      const formatName = (template: string, n: number, poe: boolean) => {
        return template.replace('{n}', String(n)).replace('{poe}', poe ? 'PoE' : '');
      };

      for (let i = 1; i <= cfg.numPorts; i++) {
        const poe = i <= cfg.poePorts;
        const name = formatName(cfg.rj45NameTemplate || 'Порт {n}', i, poe);
        const iface: DeviceInterface = {
          id: `sw-port-${i}-${Date.now()}`,
          name,
          direction: oddLeft ? (i % 2 === 1 ? 'input' : 'output') : (i % 2 === 1 ? 'output' : 'input'),
          connector: 'RJ45',
          protocol: 'Ethernet',
          poe,
          poePower: poe ? 30 : undefined,
        };
        if (iface.direction === 'input') inputs.push(iface);
        else outputs.push(iface);
      }
      for (let i = 1; i <= cfg.sfpPorts; i++) {
        const name = (cfg.sfpNameTemplate || 'SFP {n}').replace('{n}', String(i));
        const iface: DeviceInterface = {
          id: `sw-sfp-${i}-${Date.now()}`,
          name,
          direction: oddLeft ? (i % 2 === 1 ? 'input' : 'output') : (i % 2 === 1 ? 'output' : 'input'),
          connector: 'RJ45',
          protocol: 'Ethernet',
        };
        if (iface.direction === 'input') inputs.push(iface);
        else outputs.push(iface);
      }
      updated = { ...updated, inputs, outputs };
    } else {
      updated.inputs = updated.inputs.map(iface => {
        if (iface.connector === 'RJ45' && iface.poe && !iface.poePower) {
          return { ...iface, poePower: 30 };
        }
        return iface;
      });
      updated.outputs = updated.outputs.map(iface => {
        if (iface.connector === 'RJ45' && iface.poe && !iface.poePower) {
          return { ...iface, poePower: 30 };
        }
        return iface;
      });
    }

    const totalPoE = [...updated.inputs, ...updated.outputs].reduce((sum, iface) => sum + (iface.poePower || 0), 0);
    onSave({ ...updated, totalPoEConsumption: totalPoE });
    onClose();
  };

  const renderInterfaceTables = () => (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
      {(['inputs', 'outputs'] as const).map(type => {
        const list = editedData[type];
        const title = type === 'inputs' ? 'Входы' : 'Выходы';
        return (
          <div key={type} style={{ flex: 1, background: 'var(--card-bg, #f9fcff)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h4>
              <button
                onClick={() => addInterface(type)}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
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
                    <th style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 400, color: 'var(--text-secondary)' }}>PoE</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)' }}>Мощность (Вт)</th>
                    <th style={{ padding: '8px 4px', width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((iface: DeviceInterface, idx: number) => {
                    const allowedProtocols = CONNECTOR_PROTOCOL_MAP[iface.connector] || [];
                    const showPowerField = iface.connector === 'RJ45' && iface.poe;
                    return (
                      <tr key={iface.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '4px' }}>
                          <input
                            value={iface.name}
                            onChange={e => updateInterface(type, idx, 'name', e.target.value)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <select
                            value={iface.connector}
                            onChange={e => updateInterface(type, idx, 'connector', e.target.value as ConnectorType)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                          >
                            {connectorOptions.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <select
                            value={iface.protocol}
                            onChange={e => updateInterface(type, idx, 'protocol', e.target.value as ProtocolType)}
                            style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                          >
                            {allowedProtocols.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          {iface.connector === 'RJ45' && (
                            <input
                              type="checkbox"
                              checked={iface.poe || false}
                              onChange={e => {
                                const checked = e.target.checked;
                                updateInterface(type, idx, 'poe', checked);
                                if (checked && !iface.poePower) {
                                  updateInterface(type, idx, 'poePower', 30);
                                }
                              }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '4px' }}>
                          {showPowerField ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={iface.poePower || ''}
                              onChange={e => updateInterface(type, idx, 'poePower', parseFloat(e.target.value) || 0)}
                              style={{ width: '80px', padding: '6px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                            />
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <button onClick={() => removeInterface(type, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Нет {type === 'inputs' ? 'входов' : 'выходов'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderNetworkSwitchForm = () => {
    const cfg = editedData.networkSwitchConfig || {
      numPorts: 24, poePorts: 0, sfpPorts: 0, speed: '1G', portLayout: 'odd_left',
      rj45NameTemplate: 'Порт {n}', sfpNameTemplate: 'SFP {n}', highlightPorts: true
    };
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', fontWeight: 500 }}>Настройка коммутатора</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Портов RJ45</span>
            <input type="number" min="4" max="48" value={cfg.numPorts} onChange={e => updateSwitchConfig('numPorts', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }} />
          </label>
          <label>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Портов с PoE</span>
            <input type="number" min="0" max={cfg.numPorts} value={cfg.poePorts} onChange={e => updateSwitchConfig('poePorts', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }} />
          </label>
          <label>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Портов SFP</span>
            <input type="number" min="0" max="8" value={cfg.sfpPorts} onChange={e => updateSwitchConfig('sfpPorts', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }} />
          </label>
          <label>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Скорость портов</span>
            <select value={cfg.speed} onChange={e => updateSwitchConfig('speed', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>
              <option value="100M">100 Мбит/с</option>
              <option value="1G">1 Гбит/с</option>
              <option value="2.5G">2.5 Гбит/с</option>
              <option value="10G">10 Гбит/с</option>
            </select>
          </label>
          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Расположение портов</span>
            <select value={cfg.portLayout} onChange={e => updateSwitchConfig('portLayout', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>
              <option value="odd_left">Нечётные слева, чётные справа</option>
              <option value="odd_right">Нечётные справа, чётные слева</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>Шаблон названия RJ45</label>
            <input
              type="text"
              value={cfg.rj45NameTemplate || 'Порт {n}'}
              onChange={e => updateSwitchConfig('rj45NameTemplate', e.target.value)}
              style={{ width: 220, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
              placeholder="Порт {n}"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>Шаблон названия SFP</label>
            <input
              type="text"
              value={cfg.sfpNameTemplate || 'SFP {n}'}
              onChange={e => updateSwitchConfig('sfpNameTemplate', e.target.value)}
              style={{ width: 220, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
              placeholder="SFP {n}"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={cfg.highlightPorts ?? true}
              onChange={e => updateSwitchConfig('highlightPorts', e.target.checked)}
              id="highlightPorts"
            />
            <label htmlFor="highlightPorts" style={{ fontSize: 13 }}>Подсвечивать типы портов (PoE / SFP)</label>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            Используйте <code>{'{n}'}</code> для номера порта и <code>{'{poe}'}</code> для метки PoE.
          </div>
        </div>
      </div>
    );
  };

  const ColorPickerCompact = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (color: string) => void;
  }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '32px',
              height: '32px',
              background: value,
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => onChange('#2563eb')}
            style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}
          >
            Сброс
          </button>
        </div>
        {expanded && (
          <div style={{ marginTop: '8px', padding: '8px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '100%', height: '40px', marginBottom: '8px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {COLOR_PALETTE.map(c => (
                <div
                  key={c}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: c,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: value === c ? '2px solid var(--text-primary)' : '1px solid var(--border-light)',
                  }}
                  onClick={() => onChange(c)}
                />
              ))}
            </div>
          </div>
        )}
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
          maxWidth: '1200px',
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

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
          <label style={{ flex: 2 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Название устройства</span>
            <input
              value={editedData.label}
              onChange={e => setEditedData({ ...editedData, label: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-light)', borderRadius: '12px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Тип устройства</span>
            <select
              value={deviceType}
              onChange={e => setEditedData({ ...editedData, deviceType: e.target.value as DeviceType })}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            >
              <option value="generic">Универсальное</option>
              <option value="extender">Приёмник / Передатчик</option>
              <option value="matrix">Матричный коммутатор</option>
              <option value="network_switch">Сетевой коммутатор</option>
            </select>
          </label>
          <div style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Иконка</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <i className={editedData.icon || 'fas fa-microchip'} style={{ fontSize: '20px', width: '24px', textAlign: 'center' }} />
              <button
                onClick={() => setShowIconPicker(true)}
                style={{ flex: 1, padding: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)' }}
              >
                Выбрать иконку
              </button>
            </div>
          </div>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Цвет</span>
            <ColorPickerCompact
              value={editedData.color || '#2563eb'}
              onChange={(color) => setEditedData({ ...editedData, color })}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Место размещения</span>
            <input
              type="text"
              value={editedData.place || ''}
              onChange={e => setEditedData({ ...editedData, place: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-light)', borderRadius: '12px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Задержка видео (мс)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={editedData.videoLatencyMs || 0}
              onChange={e => setEditedData({ ...editedData, videoLatencyMs: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-light)', borderRadius: '12px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
            />
          </label>
        </div>

        {deviceType === 'network_switch' ? renderNetworkSwitchForm() : renderInterfaceTables()}

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
                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
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
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
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
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                  />
                </label>
                <label style={{ width: '150px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Разъём</span>
                  <select
                    value={editedData.powerSupply.connector || ''}
                    onChange={e => updatePowerSupply('connector', e.target.value || undefined)}
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
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
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>Отмена</button>
          <button onClick={handleSave} style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}>Сохранить</button>
        </div>
      </div>

      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(icon) => setEditedData({ ...editedData, icon })}
        currentIcon={editedData.icon}
      />
    </div>
  );
};

export default EditNodeModal;
