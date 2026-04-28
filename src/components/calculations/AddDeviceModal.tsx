// src/components/calculations/AddDeviceModal.tsx
import React, { useState } from 'react';
import { DeviceModel, DEVICE_MODELS } from '../../utils/tractCalculations';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (model: DeviceModel, type: string) => void;
  column: 'source' | 'matrix' | 'sink';
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onAddDevice, column }) => {
  // Типы устройств, доступные для выбранного сегмента
  const getAvailableTypes = (): { value: string; label: string }[] => {
    if (column === 'matrix') {
      return [
        { value: 'matrix', label: 'Матричный коммутатор' },
        { value: 'networkSwitch', label: 'Сетевой коммутатор' },
      ];
    }
    return [
      { value: 'source', label: 'Источник' },
      { value: 'tx', label: 'Передатчик' },
      { value: 'rx', label: 'Приёмник' },
      { value: 'splitter', label: 'Сплиттер' },
      { value: 'switch2x1', label: 'Переключатель' },
      { value: 'ledProc', label: 'LED-процессор' },
      { value: 'ledScreen', label: 'LED-экран' },
      { value: 'display', label: 'Средство отображения' },
      { value: 'dante', label: 'Dante-устройство' },
    ];
  };

  const [selectedType, setSelectedType] = useState<string>(column === 'matrix' ? 'matrix' : 'source');
  const availableTypes = getAvailableTypes();
  const models = (DEVICE_MODELS as Record<string, DeviceModel[]>)[selectedType] || [];

  const handleAdd = () => {
    // Модель выбирается по индексу в селекте (можно расширить)
    const modelIndex = (document.getElementById('modelSelect') as HTMLSelectElement)?.selectedIndex || 0;
    const model = models[modelIndex];
    if (model) {
      onAddDevice(model, selectedType);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить устройство</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Тип устройства</label>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            {availableTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Модель</label>
          <select id="modelSelect">
            {models.map((m, i) => (
              <option key={i} value={i}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleAdd}>Добавить</button>
        </div>
      </div>
    </div>
  );
};
