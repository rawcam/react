// src/components/flow/EditNodeModal.tsx (изменения только в таблице и логике)
// ... весь код до рендера таблиц остаётся без изменений

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
                          onChange={e => {
                            const newConnector = e.target.value as ConnectorType;
                            updateInterface(type, idx, 'connector', newConnector);
                            // Если сменили на RJ45 и PoE было включено, оставляем PoE, но мощность сбросим на дефолт при необходимости
                            if (newConnector !== 'RJ45') {
                              updateInterface(type, idx, 'poe', false);
                            }
                          }}
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
                                updateInterface(type, idx, 'poePower', 30); // значение по умолчанию
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
