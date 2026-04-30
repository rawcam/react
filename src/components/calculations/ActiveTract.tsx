// src/components/calculations/ActiveTract.tsx
import React, { useState } from 'react';
import { TractSimple, useTractEngine } from '../../hooks/useTractEngine';
import { AddDeviceModal } from './AddDeviceModal';
import { DeviceCard } from './DeviceCard';
import { DeviceEditModal } from './DeviceEditModal';
import { DeviceModel } from '../../utils/tractCalculations';

interface ActiveTractProps {
  tract: TractSimple;
  engine: ReturnType<typeof useTractEngine>;
  onBack: () => void;
  onSelectCalculator: (id: string) => void;
}

export const ActiveTract: React.FC<ActiveTractProps> = ({ tract, engine, onBack, onSelectCalculator }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalColumn, setModalColumn] = useState<'source' | 'matrix' | 'sink'>('source');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDevice, setEditDevice] = useState<any>(null);
  const [newName, setNewName] = useState(tract.name);

  const handleAddDevice = (model: DeviceModel, type: string) => {
    engine.addDevice(tract.id, model, type, modalColumn);
    setShowModal(false);
  };

  const handleDeleteDevice = (deviceId: string, column: 'source' | 'matrix' | 'sink') => {
    engine.removeDevice(tract.id, deviceId);
  };

  const handleToggleExpand = (deviceId: string) => {
    const allDevices = [...tract.sourceDevices, ...tract.sinkDevices, ...tract.matrixDevices];
    const dev = allDevices.find(d => d.id === deviceId);
    if (dev) {
      engine.updateDevice(tract.id, deviceId, { expanded: !dev.expanded } as any);
    }
  };

  const handleRename = (name: string) => {
    setNewName(name);
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== tract.name) {
      engine.renameTract(tract.id, newName.trim());
    }
  };

  const frames = tract.totalLatency / (1000 / 60); // FPS упрощённо 60

  return (
    <div className="active-tract-container">
      <div className="tract-header">
        <button className="btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Все тракты
        </button>
        <div className="tract-name">
          <input
            type="text"
            value={newName}
            onChange={e => handleRename(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
            className="tract-name-input"
          />
        </div>
        <div className="tract-stats-summary">
          <div className="stat-badge">⏱️ {tract.totalLatency.toFixed(2)} мс</div>
          <div className="stat-badge">🎬 {frames.toFixed(2)} кадр.</div>
          <div className="stat-badge">📡 {tract.totalBitrate} Мбит/с</div>
          <div className="stat-badge">💡 {tract.totalPower} Вт</div>
        </div>
        <div className="tract-actions">
          <button className="btn-danger" onClick={() => {
            if (confirm('Удалить тракт?')) {
              engine.deleteTract(tract.id);
              onBack();
            }
          }}>
            <i className="fas fa-trash-alt"></i> Удалить тракт
          </button>
        </div>
      </div>

      <div className="tract-columns">
        <div className="tract-column">
          <div className="column-header"><span>📡 Начало тракта</span></div>
          <div className="devices-list">
            {tract.sourceDevices.map(device => (
              <DeviceCard
                key={device.id} device={device}
                onClick={() => { setEditDevice(device); setShowEditModal(true); }}
                onDelete={e => { e.stopPropagation(); handleDeleteDevice(device.id, 'source'); }}
                onToggleExpand={e => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('source'); setShowModal(true); }}>+ Добавить устройство</button>
        </div>
        <div className="tract-column">
          <div className="column-header"><span>🔄 Коммутация</span></div>
          <div className="devices-list">
            {tract.matrixDevices.map(device => (
              <DeviceCard
                key={device.id} device={device}
                onClick={() => { setEditDevice(device); setShowEditModal(true); }}
                onDelete={e => { e.stopPropagation(); handleDeleteDevice(device.id, 'matrix'); }}
                onToggleExpand={e => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('matrix'); setShowModal(true); }}>+ Добавить коммутатор/матрицу</button>
        </div>
        <div className="tract-column">
          <div className="column-header"><span>🖥️ Конец тракта</span></div>
          <div className="devices-list">
            {tract.sinkDevices.map(device => (
              <DeviceCard
                key={device.id} device={device}
                onClick={() => { setEditDevice(device); setShowEditModal(true); }}
                onDelete={e => { e.stopPropagation(); handleDeleteDevice(device.id, 'sink'); }}
                onToggleExpand={e => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('sink'); setShowModal(true); }}>+ Добавить устройство</button>
        </div>
      </div>

      <AddDeviceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddDevice={handleAddDevice}
        column={modalColumn}
      />

      {editDevice && (
        <DeviceEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          device={editDevice}
          tractId={tract.id}
          engine={engine}   // <-- передаем engine
        />
      )}
    </div>
  );
};
