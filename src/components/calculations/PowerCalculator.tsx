// src/components/calculations/PowerCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setPowerConfig } from '../../store/powerSlice';

interface PowerCalculatorProps {
  onBack: () => void;
  engine: any; // ReturnType<typeof useTractEngine>
}

export const PowerCalculator: React.FC<PowerCalculatorProps> = ({ onBack, engine }) => {
  const dispatch = useDispatch();
  const power = useSelector((state: RootState) => state.power);
  const activeTractId = engine.activeTractId;

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
    engine.addDevice(activeTractId, {
      name: `ИБП ${Math.round(totalPower * upsAutonomy * 1.2)} ВА`,
      latency: 0,
      powerW: 0,
      shortPrefix: 'UPS',
      icon: 'fas fa-battery-full',
      bitrateFactor: undefined,
      poe: false,
      hasNetwork: false,
    }, 'powerDevice', 'sink');
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
