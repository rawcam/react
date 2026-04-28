// src/components/calculations/PowerCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setPowerConfig } from '../../store/powerSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

export const PowerCalculator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch();
  const power = useSelector((state: RootState) => state.power);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);

  const [totalPower, setTotalPower] = useState(power.totalPower);
  const [upsAutonomy, setUpsAutonomy] = useState(power.upsAutonomy);
  const [result, setResult] = useState(power.resultText);

  useEffect(() => {
    dispatch(setPowerConfig({ totalPower, upsAutonomy }));
  }, [totalPower, upsAutonomy, dispatch]);

  useEffect(() => {
    setResult(power.resultText);
  }, [power]);

  const handleAddToTract = () => {
    if (!activeTractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'powerDevice',
      modelName: `ИБП ${Math.round(totalPower * upsAutonomy * 1.2)} ВА`,
      latency: 0,
      poe: false,
      poePower: 0,
      poeEnabled: false,
      powerW: 0,
      shortName: `UPS${Math.floor(Math.random() * 1000)}`,
      ethernet: false,
      shortPrefix: 'UPS',
      icon: 'fas fa-battery-full',
    };
    dispatch(addDeviceToTract({ tractId: activeTractId, device: newDevice, column: 'sink' }));
    alert('Устройство добавлено в тракт');
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>Расчёт питания</h3>
        <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>
      </div>
      <div className="calculator-form">
        <div className="setting"><label>Суммарная мощность оборудования (Вт):</label><input type="number" value={totalPower} onChange={e => setTotalPower(parseFloat(e.target.value))} /></div>
        <div className="setting"><label>Требуемая автономия ИБП (часов):</label><input type="number" step="0.5" value={upsAutonomy} onChange={e => setUpsAutonomy(parseFloat(e.target.value))} /></div>
        <div className="result-item">
          <span className="result-label">Рекомендация</span>
          <span className="result-value">{result}</span>
        </div>
      </div>
      <div className="calculator-actions">
        <button className="btn-primary" onClick={handleAddToTract}>
          <i className="fas fa-plus"></i> Добавить в тракт
        </button>
      </div>
    </div>
  );
};
