// src/components/calculations/DeviceEditModal.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/hooks';
import { updateDevice, updateTract, TractDevice, MatrixDevice } from '../../store/tractsSlice';

interface DeviceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: TractDevice | MatrixDevice;
  tractId: string;
}

export const DeviceEditModal: React.FC<DeviceEditModalProps> = ({ isOpen, onClose, device, tractId }) => {
  const dispatch = useAppDispatch();
  const isMatrix = device.type === 'matrix';

  const [latency, setLatency] = useState<number>(0);
  const [powerW, setPowerW] = useState<number>(0);
  const [poeEnabled, setPoeEnabled] = useState<boolean>(false);
  const [poePower, setPoePower] = useState<number>(0);
  const [ethernet, setEthernet] = useState<boolean>(false);
  const [shortName, setShortName] = useState<string>('');
  const [usb, setUsb] = useState<boolean>(false);
  const [usbVersion, setUsbVersion] = useState<string>('2.0');
  const [inputs, setInputs] = useState<number>(0);
  const [outputs, setOutputs] = useState<number>(0);

  useEffect(() => {
    if (isMatrix) {
      const m = device as MatrixDevice;
      setLatency((m.latencyIn || 0) + (m.latencyOut || 0));
      setPowerW(m.powerW || 0);
      setInputs(m.inputs || 0);
      setOutputs(m.outputs || 0);
      setShortName(m.shortName || m.shortPrefix || '');
    } else {
      const d = device as TractDevice;
      setLatency(d.latency || 0);
      setPowerW(d.powerW || 0);
      setPoeEnabled(d.poeEnabled || false);
      setPoePower(d.poePower || 0);
      setEthernet(d.ethernet || false);
      setUsb(d.usb || false);
      setUsbVersion(d.usbVersion || '2.0');
      setInputs(d.inputs || 0);
      setOutputs(d.outputs || 0);
      setShortName(d.shortName || d.shortPrefix || '');
    }
  }, [device, isMatrix]);

  const handleSave = () => {
    if (isMatrix) {
      const m = device as MatrixDevice;
      const halfLatency = latency / 2;
      dispatch(updateTract({
        ...m,
        id: tractId,
        matrixDevices: [{ ...m, latencyIn: halfLatency, latencyOut: halfLatency, powerW, inputs, outputs, shortName }],
      } as any));
    } else {
      dispatch(updateDevice({
        tractId,
        deviceId: device.id,
        updates: {
          latency,
          powerW,
          poeEnabled,
          poePower: poeEnabled ? poePower : 0,
          ethernet,
          shortName,
          usb,
          usbVersion,
          inputs,
          outputs,
        },
      }));
    }
    onClose();
  };

  if (!isOpen) return null;

  const supportsPoE = 'poe' in device ? (device as TractDevice).poe === true : false;
  const hasNetwork = 'hasNetwork' in device ? (device as TractDevice).hasNetwork !== false : false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '420px', maxWidth: '90vw', padding: '24px' }}>
        <div className="modal-header">
          <h3>Редактировать: {isMatrix ? (device as MatrixDevice).name : (device as TractDevice).modelName}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="form-group">
          <label>Короткое имя</label>
          <input type="text" value={shortName} onChange={e => setShortName(e.target.value)} />
        </div>

        {isMatrix ? (
          <>
            <div className="form-group">
              <label>Общая задержка (мс)</label>
              <input type="number" step="0.1" value={latency} onChange={e => setLatency(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Мощность (Вт)</label>
              <input type="number" value={powerW} onChange={e => setPowerW(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Входов</label>
              <input type="number" value={inputs} onChange={e => setInputs(parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Выходов</label>
              <input type="number" value={outputs} onChange={e => setOutputs(parseInt(e.target.value) || 0)} />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Задержка (мс)</label>
              <input type="number" step="0.1" value={latency} onChange={e => setLatency(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Мощность (Вт)</label>
              <input type="number" value={powerW} onChange={e => setPowerW(parseFloat(e.target.value) || 0)} />
            </div>

            {hasNetwork && (
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

            {(device.type === 'matrix' || inputs !== undefined) && (
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
