// src/components/flow/EditNodeModal.tsx
// ... (импорты без изменений)

const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, node, onClose, onSave }) => {
  // ... (состояния)

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
    }
    const totalPoE = [...updated.inputs, ...updated.outputs].reduce((sum, iface) => sum + (iface.poePower || 0), 0);
    onSave({ ...updated, totalPoEConsumption: totalPoE });
    onClose();
  };

  const renderNetworkSwitchForm = () => {
    const cfg = editedData.networkSwitchConfig || {
      numPorts: 24, poePorts: 0, sfpPorts: 0, speed: '1G', portLayout: 'odd_left',
      rj45NameTemplate: 'Порт {n}', sfpNameTemplate: 'SFP {n}', highlightPorts: true
    };
    return (
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', fontWeight: 500 }}>Настройка коммутатора</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* ... существующие поля numPorts, poePorts, sfpPorts, speed, portLayout ... */}
        </div>
        <div style={{ marginTop: '20px' }}>
          <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>Шаблон RJ45</label>
            <input
              type="text"
              value={cfg.rj45NameTemplate || 'Порт {n}'}
              onChange={e => updateSwitchConfig('rj45NameTemplate', e.target.value)}
              style={{ width: 200, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
              placeholder="Порт {n}"
            />
          </div>
          <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>Шаблон SFP</label>
            <input
              type="text"
              value={cfg.sfpNameTemplate || 'SFP {n}'}
              onChange={e => updateSwitchConfig('sfpNameTemplate', e.target.value)}
              style={{ width: 200, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
              placeholder="SFP {n}"
            />
          </div>
          <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={cfg.highlightPorts ?? true}
              onChange={e => updateSwitchConfig('highlightPorts', e.target.checked)}
              id="highlightPorts"
            />
            <label htmlFor="highlightPorts" style={{ fontSize: 13 }}>Подсвечивать типы портов (PoE / SFP)</label>
          </div>
        </div>
      </div>
    );
  };

  // ... (остальной код без изменений)
};

export default EditNodeModal;
