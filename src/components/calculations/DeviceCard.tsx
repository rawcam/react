// src/components/calculations/DeviceCard.tsx
import React from 'react';
import { TractDevice } from '../../store/tractsSlice';

interface DeviceCardProps {
  device: TractDevice;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick, onDelete, onToggleExpand }) => {
  // Определяем, свёрнут ли компонент (по умолчанию развёрнут)
  const isExpanded = device.expanded !== false;

  // Короткое имя, если свёрнут
  const shortName = device.shortName || device.shortPrefix || '?';
  const displayName = isExpanded ? device.modelName : shortName;

  // Детали для развёрнутого состояния
  const details: string[] = [];
  if (device.latency !== undefined) details.push(`⏱️ ${device.latency} мс`);
  if (device.powerW) details.push(`💡 ${device.powerW} Вт`);
  if (device.poeEnabled) details.push(`🔌 PoE ${device.poePower} Вт`);
  if (device.ethernet && !device.poeEnabled) details.push(`🌐 Ethernet`);
  if (device.inputs !== undefined && device.outputs !== undefined) {
    details.push(`Вх/вых: ${device.inputs}/${device.outputs}`);
  }
  if (device.ports) details.push(`Портов: ${device.ports}`);
  if (device.switchingLatency) details.push(`Коммутация: ${device.switchingLatency} мс`);

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
          {/* Дополнительные элементы управления PoE, Ethernet, питание могут быть здесь, но они редактируются через модальное окно */}
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
