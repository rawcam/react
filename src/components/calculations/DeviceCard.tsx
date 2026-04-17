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
  return (
    <div className="device-card" onClick={onClick}>
      <div className="device-card-header">
        <span className="device-name">{device.modelName || device.shortName}</span>
        <div className="device-actions">
          <button className="device-expand-btn" onClick={onToggleExpand}>
            <i className={`fas fa-chevron-${device.expanded ? 'up' : 'down'}`}></i>
          </button>
          <button className="device-delete-btn" onClick={onDelete}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div className="device-card-stats">
        <span>⏱️ {device.latency} мс</span>
        <span>💡 {device.powerW} Вт</span>
        {device.poeEnabled && <span>🔌 PoE {device.poePower} Вт</span>}
      </div>
      {device.expanded && (
        <div className="device-card-details">
          {device.type && <div>Тип: {device.type}</div>}
          {device.ports && <div>Портов: {device.ports}</div>}
          {device.inputs && <div>Входов: {device.inputs}</div>}
          {device.outputs && <div>Выходов: {device.outputs}</div>}
          {device.speed && <div>Скорость: {device.speed} Мбит/с</div>}
          {device.switchingLatency !== undefined && <div>Задержка коммутации: {device.switchingLatency} мс</div>}
          {device.poeBudget && <div>Бюджет PoE: {device.poeBudget} Вт</div>}
        </div>
      )}
    </div>
  );
};
