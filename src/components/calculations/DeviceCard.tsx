// src/components/calculations/DeviceCard.tsx
import React from 'react';
import { TractDevice, MatrixDevice } from '../../store/tractsSlice';

interface DeviceCardProps {
  device: TractDevice | MatrixDevice;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick, onDelete, onToggleExpand }) => {
  const isExpanded = device.expanded !== false;

  const modelName = 'modelName' in device ? device.modelName : device.name;
  const shortName = 'shortName' in device ? device.shortName : (device.shortPrefix || '?');
  const displayName = isExpanded ? modelName : shortName;

  const details: string[] = [];
  if ('latency' in device && device.latency !== undefined) details.push(`⏱️ ${device.latency} мс`);
  if ('powerW' in device && device.powerW) details.push(`💡 ${device.powerW} Вт`);
  if ('poeEnabled' in device && device.poeEnabled) details.push(`🔌 PoE ${device.poePower} Вт`);
  if ('ethernet' in device && device.ethernet && !('poeEnabled' in device && device.poeEnabled)) details.push(`🌐 Ethernet`);
  if ('inputs' in device && device.inputs !== undefined && 'outputs' in device && device.outputs !== undefined) {
    details.push(`Вх/вых: ${device.inputs}/${device.outputs}`);
  }
  if ('ports' in device) details.push(`Портов: ${device.ports}`);
  if ('switchingLatency' in device && device.switchingLatency) details.push(`Коммутация: ${device.switchingLatency} мс`);

  const detailText = details.join(' · ');

  return (
    <div
      className={`device-card ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {isExpanded ? (
        <>
          <div className="device-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="device-name">
              <i className={device.icon || 'fas fa-microchip'} style={{ marginRight: 8 }} />
              {displayName}
            </span>
            <div className="device-actions" style={{ display: 'flex', gap: 4 }}>
              <button className="device-expand-btn" onClick={onToggleExpand} title="Свернуть">
                <i className="fas fa-compress" />
              </button>
              <button className="device-delete-btn" onClick={onDelete} title="Удалить">
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
          <div className="device-card-stats" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            {detailText}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className={device.icon || 'fas fa-microchip'} />
            <span className="device-name" style={{ fontWeight: 500 }}>{shortName}</span>
          </div>
          <div className="device-actions" style={{ display: 'flex', gap: 4 }}>
            <button className="device-expand-btn" onClick={onToggleExpand} title="Развернуть">
              <i className="fas fa-expand" />
            </button>
            <button className="device-delete-btn" onClick={onDelete} title="Удалить">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
