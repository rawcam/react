// src/components/calculations/DeviceEditModal.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { updateDevice, TractDevice } from '../../store/tractsSlice';

interface DeviceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: TractDevice;
  tractId: string;
}

export const DeviceEditModal: React.FC<DeviceEditModalProps> = ({ isOpen, onClose, device, tractId }) => {
  const dispatch = useAppDispatch();

  const [latency, setLatency] = useState(device.latency);
  const [powerW, setPowerW] = useState(device.powerW);
  const [poeEnabled, setPoeEnabled] = useState(device.poeEnabled);
  const [poePower, setPoePower] = useState(device.poePower);
  const [ethernet, setEthernet] = useState(device.ethernet);
  const [shortName, setShortName] = useState(device.shortName || device.shortPrefix || '');
  const [usb, setUsb] = useState(device.usb || false);
  const [usbVersion, setUsbVersion] = useState(device.usbVersion || '2.0');
  const [inputs, setInputs] = useState(device.inputs || 0);
  const [outputs, setOutputs] = useState(device.outputs || 0);

  useEffect(() => {
    setLatency(device.latency);
    setPowerW(device.powerW);
    setPoeEnabled(device.poeEnabled);
    setPoePower(device.poePower);
    setEthernet(device.ethernet);
    setShortName(device.shortName || device.shortPrefix || '');
    setUsb(device.usb || false);
    setUsbVersion(device.usbVersion || '2.0');
    setInputs(device.inputs || 0);
    setOutputs(device.outputs || 0);
  }, [device]);

  const handleSave = () => {
    dispatch(updateDevice({
      tractId,
      deviceId: device.id,
      updates: {
        latency,
        powerW,
        poeEnabled: poeEnabled,
        poePower: poeEnabled ? poePower : 0,
        ethernet,
        shortName,
        usb,
        usbVersion,
        inputs,
        outputs,
      },
    }));
    onClose();
  };

  if (!isOpen) return null;

  // Поддержка PoE: показываем, если устройство поддерживает PoE (poe === true) или уже poeEnabled
  const supportsPoE = device.poe === true || device.poeEnabled;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '420px', maxWidth: '90vw', padding: '24px' }}>
        <div className="modal-header">
          <h3>Редактировать: {device.modelName}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="form-group">
          <label>Короткое имя</label>
          <input type="text" value={shortName} onChange={e => setShortName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Задержка (мс)</label>
          <input type="number" step="0.1" value={latency} onChange={e => setLatency(parseFloat(e.target.value) || 0)} />
        </div>

        <div className="form-group">
          <label>Мощность (Вт)</label>
          <input type="number" value={powerW} onChange={e => setPowerW(parseFloat(e.target.value) || 0)} />
        </div>

        {device.hasNetwork !== false && (
          <div className="form-group">
            <label>
              <input type="checkbox" checked={ethernet} onChange={e => setEthernet(e.target.checked)} />
              Использовать Ethernet
            </label>
          </div>
        )}

        {supportsPoE && (
          <div className="form-group">
            <label>
              <input type="checkbox" checked={poeEnabled} onChange={e => {
                setPoeEnabled(e.target.checked);
                if (e.target.checked) setEthernet(false);
              }} />
              Использовать PoE
            </label>
            {poeEnabled && (
              <select value={poePower} onChange={e => setPoePower(Number(e.target.value))} style={{ marginLeft: 20 }}>
                <option value={15}>15 Вт</option>
                <option value={30}>30 Вт</option>
                <option value={60}>60 Вт</option>
                <option value={90}>90 Вт</option>
              </select>
            )}
          </div>
        )}

        {(device.type === 'tx' || device.type === 'rx') && (
          <div className="form-group">
            <label>
              <input type="checkbox" checked={usb} onChange={e => setUsb(e.target.checked)} />
              USB
            </label>
            {usb && (
              <select value={usbVersion} onChange={e => setUsbVersion(e.target.value)} style={{ marginLeft: 20 }}>
                <option value="2.0">USB 2.0</option>
                <option value="3.0">USB 3.0</option>
                <option value="3.1">USB 3.1</option>
              </select>
            )}
          </div>
        )}

        {(device.type === 'matrix' || device.inputs !== undefined) && (
          <>
            <div className="form-group">
              <label>Входов</label>
              <input type="number" value={inputs} onChange={e => setInputs(parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Выходов</label>
              <input type="number" value={outputs} onChange={e => setOutputs(parseInt(e.target.value) || 0)} />
            </div>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};
