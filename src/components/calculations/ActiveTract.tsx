// src/components/calculations/ActiveTract.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  addDeviceToTract,
  removeDeviceFromTract,
  updateDevice,
  deleteTract,
  setActiveTract,
  setViewMode,
  recalcAll,
  TractDevice,
} from '../../store/tractsSlice';
import { AddDeviceModal } from './AddDeviceModal';
import { DeviceCard } from './DeviceCard';
import { DeviceEditModal } from './DeviceEditModal';
import { DeviceModel, DEVICE_MODELS } from '../../utils/tractCalculations';

interface ActiveTractProps {
  onBack: () => void;
  onSelectCalculator: (id: string) => void;
}

export const ActiveTract: React.FC<ActiveTractProps> = ({ onBack, onSelectCalculator }) => {
  const dispatch = useAppDispatch();
  const tracts = useAppSelector(state => state.tracts.tracts);
  const activeTractId = useAppSelector(state => state.tracts.activeTractId);
  const projectSwitches = useAppSelector(state => state.tracts.projectSwitches);
  const videoSettings = useAppSelector(state => state.video);
  const networkSettings = useAppSelector(state => state.network);

  const activeTract = tracts.find(t => t.id === activeTractId) || null;

  const [showModal, setShowModal] = useState(false);
  const [modalColumn, setModalColumn] = useState<'source' | 'matrix' | 'sink'>('source');
  const [selectedDevice, setSelectedDevice] = useState<TractDevice | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Пересчёт всех метрик при любом изменении
  React.useEffect(() => {
    if (activeTract) {
      const state = {
        tracts,
        projectSwitches,
        activeTractId,
        viewMode: 'active' as const,
        activeCalculator: null,
      };
      recalcAll(state, videoSettings, networkSettings);
    }
  }, [activeTract?.sourceDevices, activeTract?.sinkDevices, projectSwitches, videoSettings, networkSettings]);

  const handleAddDevice = (model: DeviceModel, type: string) => {
    if (!activeTract) return;
    const newDevice: TractDevice = {
      id: Date.now().toString(),
      modelName: model.name,
      type,
      latency: model.latency || 0,
      powerW: model.powerW || 0,
      shortName: '',
      ethernet: false,
      poeEnabled: false,
      poePower: model.poePower || 0,
      bitrateFactor: model.bitrateFactor,
      hasNetwork: model.hasNetwork,
      shortPrefix: model.shortPrefix,
      icon: `fas ${model.icon || 'fa-question-circle'}`,
      expanded: true,
      inputs: model.inputs,
      outputs: model.outputs,
    };
    dispatch(addDeviceToTract({ tractId: activeTract.id, device: newDevice, column: modalColumn }));
    setShowModal(false);
  };

  const handleDeleteDevice = (deviceId: string, column: 'source' | 'matrix' | 'sink') => {
    if (!activeTract) return;
    dispatch(removeDeviceFromTract({ tractId: activeTract.id, deviceId }));
  };

  const handleToggleExpand = (deviceId: string) => {
    if (!activeTract) return;
    const device = [...activeTract.sourceDevices, ...activeTract.sinkDevices].find(d => d.id === deviceId);
    if (device) {
      dispatch(updateDevice({ tractId: activeTract.id, deviceId, updates: { expanded: !device.expanded } }));
    }
  };

  const handleRename = (newName: string) => {
    if (!activeTract) return;
    dispatch(updateTract({ ...activeTract, name: newName }));
  };

  if (!activeTract) {
    return (
      <div className="empty-calculations">
        <i className="fas fa-road"></i>
        <h3>Нет активного тракта</h3>
        <p>Выберите существующий тракт в сайдбаре или создайте новый.</p>
        <button className="btn-primary" onClick={onBack}>К списку трактов</button>
      </div>
    );
  }

  const frames = activeTract.totalLatency / (1000 / videoSettings.fps);

  return (
    <div className="active-tract-container">
      <div className="tract-header">
        <button className="btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Все тракты
        </button>
        <div className="tract-name">
          <input
            type="text"
            value={activeTract.name}
            onChange={e => handleRename(e.target.value)}
            className="tract-name-input"
          />
        </div>
        <div className="tract-stats-summary">
          <div className="stat-badge">⏱️ {activeTract.totalLatency.toFixed(2)} мс</div>
          <div className="stat-badge">🎬 {frames.toFixed(2)} кадр.</div>
          <div className="stat-badge">📡 {activeTract.totalBitrate} Мбит/с</div>
          <div className="stat-badge">💡 {activeTract.totalPower} Вт</div>
        </div>
        <div className="tract-actions">
          <button className="btn-danger" onClick={() => {
            if (confirm('Удалить тракт?')) {
              dispatch(deleteTract(activeTract.id));
              dispatch(setActiveTract(null));
              onBack();
            }
          }}>
            <i className="fas fa-trash-alt"></i> Удалить тракт
          </button>
        </div>
      </div>

      <div className="tract-columns">
        <div className="tract-column">
          <div className="column-header">
            <span>📡 Начало тракта</span>
            <button className="btn-icon" onClick={() => onSelectCalculator('video')}>
              <i className="fas fa-calculator"></i>
            </button>
          </div>
          <div className="devices-list">
            {activeTract.sourceDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={() => { setSelectedDevice(device); setShowEditModal(true); }}
                onDelete={(e) => { e.stopPropagation(); handleDeleteDevice(device.id, 'source'); }}
                onToggleExpand={(e) => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('source'); setShowModal(true); }}>
            + Добавить устройство
          </button>
        </div>

        <div className="tract-column">
          <div className="column-header">
            <span>🔄 Коммутация</span>
            <button className="btn-icon" onClick={() => onSelectCalculator('network')}>
              <i className="fas fa-calculator"></i>
            </button>
          </div>
          <div className="devices-list">
            {activeTract.matrixDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={() => { setSelectedDevice(device); setShowEditModal(true); }}
                onDelete={(e) => { e.stopPropagation(); handleDeleteDevice(device.id, 'matrix'); }}
                onToggleExpand={(e) => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('matrix'); setShowModal(true); }}>
            + Добавить коммутатор/матрицу
          </button>
        </div>

        <div className="tract-column">
          <div className="column-header">
            <span>🖥️ Конец тракта</span>
            <button className="btn-icon" onClick={() => onSelectCalculator('video')}>
              <i className="fas fa-calculator"></i>
            </button>
          </div>
          <div className="devices-list">
            {activeTract.sinkDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onClick={() => { setSelectedDevice(device); setShowEditModal(true); }}
                onDelete={(e) => { e.stopPropagation(); handleDeleteDevice(device.id, 'sink'); }}
                onToggleExpand={(e) => { e.stopPropagation(); handleToggleExpand(device.id); }}
              />
            ))}
          </div>
          <button className="add-btn" onClick={() => { setModalColumn('sink'); setShowModal(true); }}>
            + Добавить устройство
          </button>
        </div>
      </div>

      <AddDeviceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddDevice={handleAddDevice}
        column={modalColumn}
      />

      {selectedDevice && (
        <DeviceEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          device={selectedDevice}
          tractId={activeTract.id}
        />
      )}
    </div>
  );
};
