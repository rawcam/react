// src/features/network/NetworkSection.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setNetworkSettings } from '../../store/networkSlice';

export const NetworkSection: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.network);

  const handleChange = (field: string, value: any) => {
    dispatch(setNetworkSettings({ [field]: value }));
  };

  return (
    <div className="section-content-inner">
      <div className="setting">
        <label>Среда передачи:</label>
        <select value={settings.cable} onChange={e => handleChange('cable', e.target.value)}>
          <option value="Cat5e">Cat5e</option>
          <option value="Cat6">Cat6</option>
          <option value="Cat6a">Cat6a</option>
          <option value="Cat7">Cat7</option>
          <option value="Cat8">Cat8</option>
          <option value="OM3">Оптика OM3</option>
          <option value="wireless">Беспровод</option>
        </select>
      </div>
      <div className="setting checkbox-row">
        <label>Multicast:</label>
        <input type="checkbox" checked={settings.multicast} onChange={e => handleChange('multicast', e.target.checked)} />
      </div>
      <div className="setting checkbox-row">
        <label>QoS:</label>
        <input type="checkbox" checked={settings.qos} onChange={e => handleChange('qos', e.target.checked)} />
      </div>
      <div className="setting">
        <label>Тип сети:</label>
        <select value={settings.networkType} onChange={e => handleChange('networkType', e.target.value)}>
          <option value="managed">Управляемая</option>
          <option value="unmanaged">Неуправляемая</option>
        </select>
      </div>
      <div className="setting">
        <label>Синхронизация:</label>
        <select value={settings.syncProtocol} onChange={e => handleChange('syncProtocol', e.target.value)}>
          <option value="ptp">PTP</option>
          <option value="ntp">NTP</option>
          <option value="none">Нет</option>
        </select>
      </div>
      <div className="setting checkbox-row">
        <label>Резервирование:</label>
        <input type="checkbox" checked={settings.redundance} onChange={e => handleChange('redundance', e.target.checked)} />
      </div>
    </div>
  );
};
