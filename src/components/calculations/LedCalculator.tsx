// src/components/calculations/LedCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setLedConfig } from '../../store/ledSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

interface LedCalculatorProps {
  onBack: () => void;
  engine?: any;
}

export const LedCalculator: React.FC<LedCalculatorProps> = ({ onBack, engine }) => {
  const dispatch = useDispatch();
  const ledConfig = useSelector((state: RootState) => state.led);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);

  const [mode, setMode] = useState<'cabinets' | 'resolution'>(ledConfig.activeMode);
  const [pitch, setPitch] = useState(ledConfig.pitch);
  const [cabinetWidth, setCabinetWidth] = useState(ledConfig.cabinetWidth);
  const [cabinetHeight, setCabinetHeight] = useState(ledConfig.cabinetHeight);
  const [cabinetsW, setCabinetsW] = useState(ledConfig.cabinetsW);
  const [cabinetsH, setCabinetsH] = useState(ledConfig.cabinetsH);
  const [targetResolution, setTargetResolution] = useState<'fhd' | '4k' | 'custom'>(ledConfig.targetResolution);
  const [customResW, setCustomResW] = useState(ledConfig.customResW);
  const [customResH, setCustomResH] = useState(ledConfig.customResH);

  const [result, setResult] = useState({
    width_m: ledConfig.width_m, height_m: ledConfig.height_m, resW: ledConfig.resW, resH: ledConfig.resH, area: ledConfig.area, power: ledConfig.power
  });

  useEffect(() => {
    const config = { activeMode: mode, pitch, cabinetWidth, cabinetHeight, cabinetsW, cabinetsH, targetResolution, customResW, customResH };
    dispatch(setLedConfig(config));
  }, [mode, pitch, cabinetWidth, cabinetHeight, cabinetsW, cabinetsH, targetResolution, customResW, customResH, dispatch]);

  useEffect(() => {
    setResult({ width_m: ledConfig.width_m, height_m: ledConfig.height_m, resW: ledConfig.resW, resH: ledConfig.resH, area: ledConfig.area, power: ledConfig.power });
  }, [ledConfig]);

  const handleAddToTract = () => {
    const tractId = engine?.activeTractId || activeTractId;
    if (!tractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'ledScreen',
      modelName: `LED экран ${result.resW}x${result.resH}`,
      latency: 4.5,
      poe: false,
      poePower: 0,
      poeEnabled: false,
      powerW: result.power,
      shortName: `LED${Math.floor(Math.random() * 1000)}`,
      ethernet: false,
      width_m: result.width_m,
      height_m: result.height_m,
      resW: result.resW,
      resH: result.resH,
      area: result.area,
      shortPrefix: 'LED',
      icon: 'fas fa-border-all',
    };
    if (engine) {
      engine.addDevice(tractId, {
        name: newDevice.modelName,
        latency: newDevice.latency,
        powerW: newDevice.powerW,
        shortPrefix: newDevice.shortPrefix,
        icon: newDevice.icon,
        bitrateFactor: undefined,
        poe: false,
        hasNetwork: false,
        width_m: newDevice.width_m,
        height_m: newDevice.height_m,
        resW: newDevice.resW,
        resH: newDevice.resH,
        area: newDevice.area,
      }, 'ledScreen', 'sink');
    } else {
      dispatch(addDeviceToTract({ tractId, device: newDevice, column: 'sink' }));
    }
    alert('Устройство добавлено в тракт');
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>LED-калькулятор</h3>
        <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>
      </div>
      <div className="calculator-form">
        <div className="setting"><label>Режим:</label><select value={mode} onChange={e => setMode(e.target.value as 'cabinets' | 'resolution')}><option value="cabinets">По кабинетам</option><option value="resolution">По разрешению</option></select></div>
        {mode === 'cabinets' && (<><div className="setting"><label>Шаг пикселя (мм):</label><input type="number" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} /></div><div className="setting"><label>Ширина кабинета (мм):</label><input type="number" value={cabinetWidth} onChange={e => setCabinetWidth(parseFloat(e.target.value))} /></div><div className="setting"><label>Высота кабинета (мм):</label><input type="number" value={cabinetHeight} onChange={e => setCabinetHeight(parseFloat(e.target.value))} /></div><div className="setting"><label>Кабинетов по ширине:</label><input type="number" value={cabinetsW} onChange={e => setCabinetsW(parseInt(e.target.value))} /></div><div className="setting"><label>Кабинетов по высоте:</label><input type="number" value={cabinetsH} onChange={e => setCabinetsH(parseInt(e.target.value))} /></div></>)}
        {mode === 'resolution' && (<><div className="setting"><label>Шаг пикселя (мм):</label><input type="number" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} /></div><div className="setting"><label>Целевое разрешение:</label><select value={targetResolution} onChange={e => setTargetResolution(e.target.value as 'fhd' | '4k' | 'custom')}><option value="fhd">Full HD (1920x1080)</option><option value="4k">4K (3840x2160)</option><option value="custom">Пользовательское</option></select></div>{targetResolution === 'custom' && (<><div className="setting"><label>Ширина (пикс):</label><input type="number" value={customResW} onChange={e => setCustomResW(parseInt(e.target.value))} /></div><div className="setting"><label>Высота (пикс):</label><input type="number" value={customResH} onChange={e => setCustomResH(parseInt(e.target.value))} /></div></>)}</>)}
        <div className="result-grid">
          <div className="result-item"><span className="result-label">Разрешение</span><span className="result-value">{result.resW}×{result.resH}</span></div>
          <div className="result-item"><span className="result-label">Размер (м)</span><span className="result-value">{result.width_m.toFixed(1)}×{result.height_m.toFixed(1)}</span></div>
          <div className="result-item"><span className="result-label">Площадь (м²)</span><span className="result-value">{result.area.toFixed(1)}</span></div>
          <div className="result-item"><span className="result-label">Мощность (Вт)</span><span className="result-value">{Math.round(result.power)}</span></div>
        </div>
      </div>
      <div className="calculator-actions">
        <button className="btn-primary" onClick={handleAddToTract}><i className="fas fa-plus"></i> Добавить в тракт</button>
      </div>
    </div>
  );
};
