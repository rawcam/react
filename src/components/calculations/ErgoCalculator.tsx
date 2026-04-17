// src/components/calculations/ErgoCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setErgoConfig } from '../../store/ergoSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

export const ErgoCalculator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch();
  const ergo = useSelector((state: RootState) => state.ergo);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);

  const [screenWidth, setScreenWidth] = useState(ergo.screenWidth);
  const [screenHeight, setScreenHeight] = useState(ergo.screenHeight);
  const [distance, setDistance] = useState(ergo.distance);
  const [result, setResult] = useState(ergo.resultText);

  useEffect(() => {
    dispatch(setErgoConfig({ screenWidth, screenHeight, distance }));
  }, [screenWidth, screenHeight, distance, dispatch]);

  useEffect(() => {
    setResult(ergo.resultText);
  }, [ergo]);

  const handleAddToTract = () => {
    if (!activeTractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'display',
      modelName: `ЭКП ${screenWidth}x${screenHeight} см`,
      latency: 0,
      poeEnabled: false,
      powerW: 0,
      shortName: `ECP${Math.floor(Math.random() * 1000)}`,
      ethernet: false,
    };
    dispatch(addDeviceToTract({ tractId: activeTractId, device: newDevice, column: 'sink' }));
    alert('Устройство добавлено в тракт');
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>Эргономика ЭКП</h3>
        <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>
      </div>
      <div className="calculator-form">
        <div className="setting"><label>Ширина экрана (см):</label><input type="number" value={screenWidth} onChange={e => setScreenWidth(parseFloat(e.target.value))} /></div>
        <div className="setting"><label>Высота экрана (см):</label><input type="number" value={screenHeight} onChange={e => setScreenHeight(parseFloat(e.target.value))} /></div>
        <div className="setting"><label>Расстояние до экрана (см):</label><input type="number" value={distance} onChange={e => setDistance(parseFloat(e.target.value))} /></div>
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
