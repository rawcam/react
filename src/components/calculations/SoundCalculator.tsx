// src/components/calculations/SoundCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSoundConfig } from '../../store/soundSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

export const SoundCalculator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch();
  const sound = useSelector((state: RootState) => state.sound);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);

  const [mode, setMode] = useState(sound.activeMode);
  const [sensitivity, setSensitivity] = useState(sound.sensitivity);
  const [sourcePower, setSourcePower] = useState(sound.sourcePower);
  const [distance, setDistance] = useState(sound.distance);
  const [headroom, setHeadroom] = useState(sound.headroom);
  const [roomGain, setRoomGain] = useState(sound.roomGain);
  const [startDistance, setStartDistance] = useState(sound.startDistance);
  const [endDistance, setEndDistance] = useState(sound.endDistance);
  const [powerChangeFrom, setPowerChangeFrom] = useState(sound.powerChangeFrom);
  const [powerChangeTo, setPowerChangeTo] = useState(sound.powerChangeTo);
  const [roomVolume, setRoomVolume] = useState(sound.roomVolume);
  const [roomArea, setRoomArea] = useState(sound.roomArea);
  const [avgAbsorption, setAvgAbsorption] = useState(sound.avgAbsorption);
  const [speakerSensitivity, setSpeakerSensitivity] = useState(sound.speakerSensitivity);
  const [requiredSPL, setRequiredSPL] = useState(sound.requiredSPL);
  const [result, setResult] = useState({ value: sound.resultValue, text: sound.resultText });

  useEffect(() => {
    const config: any = { activeMode: mode };
    if (mode === 'spl') {
      config.sensitivity = sensitivity; config.sourcePower = sourcePower;
      config.distance = distance; config.headroom = headroom; config.roomGain = roomGain;
    } else if (mode === 'drop') {
      config.startDistance = startDistance; config.endDistance = endDistance;
    } else if (mode === 'power') {
      config.powerChangeFrom = powerChangeFrom; config.powerChangeTo = powerChangeTo;
    } else if (mode === 'rt60') {
      config.roomVolume = roomVolume; config.roomArea = roomArea; config.avgAbsorption = avgAbsorption;
    } else if (mode === 'speakers') {
      config.speakerSensitivity = speakerSensitivity; config.requiredSPL = requiredSPL; config.distance = distance;
    }
    dispatch(setSoundConfig(config));
  }, [mode, sensitivity, sourcePower, distance, headroom, roomGain, startDistance, endDistance, powerChangeFrom, powerChangeTo, roomVolume, roomArea, avgAbsorption, speakerSensitivity, requiredSPL, dispatch]);

  useEffect(() => {
    setResult({ value: sound.resultValue, text: sound.resultText });
  }, [sound]);

  const handleAddToTract = () => {
    if (!activeTractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'soundDevice',
      modelName: `Акустическая система (${result.text})`,
      latency: 0,
      poe: false,
      poePower: 0,
      poeEnabled: false,
      powerW: 0,
      shortName: `SPK${Math.floor(Math.random() * 1000)}`,
      ethernet: false,
      shortPrefix: 'SPK',
      icon: 'fas fa-volume-up',
    };
    dispatch(addDeviceToTract({ tractId: activeTractId, device: newDevice, column: 'sink' }));
    alert('Устройство добавлено в тракт');
  };

  const modes = [
    { value: 'spl', label: 'SPL на расстоянии' },
    { value: 'drop', label: 'Падение SPL от расстояния' },
    { value: 'power', label: 'Изменение SPL от мощности' },
    { value: 'rt60', label: 'RT60 (реверберация)' },
    { value: 'speakers', label: 'Подбор громкоговорителей' },
  ];

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>Звуковой калькулятор</h3>
        <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>
      </div>
      <div className="calculator-form">
        <div className="setting"><label>Режим:</label><select value={mode} onChange={e => setMode(e.target.value as any)}>{modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
        {mode === 'spl' && (<><div className="setting"><label>Чувствительность (дБ):</label><input type="number" value={sensitivity} onChange={e => setSensitivity(parseFloat(e.target.value))} /></div><div className="setting"><label>Мощность (Вт):</label><input type="number" value={sourcePower} onChange={e => setSourcePower(parseFloat(e.target.value))} /></div><div className="setting"><label>Расстояние (м):</label><input type="number" step="0.1" value={distance} onChange={e => setDistance(parseFloat(e.target.value))} /></div><div className="setting"><label>Запас по звуку (дБ):</label><input type="number" value={headroom} onChange={e => setHeadroom(parseFloat(e.target.value))} /></div><div className="setting"><label>Усиление помещения (дБ):</label><input type="number" value={roomGain} onChange={e => setRoomGain(parseFloat(e.target.value))} /></div></>)}
        {mode === 'drop' && (<><div className="setting"><label>Начальное расстояние (м):</label><input type="number" step="0.1" value={startDistance} onChange={e => setStartDistance(parseFloat(e.target.value))} /></div><div className="setting"><label>Конечное расстояние (м):</label><input type="number" step="0.1" value={endDistance} onChange={e => setEndDistance(parseFloat(e.target.value))} /></div></>)}
        {mode === 'power' && (<><div className="setting"><label>Начальная мощность (Вт):</label><input type="number" value={powerChangeFrom} onChange={e => setPowerChangeFrom(parseFloat(e.target.value))} /></div><div className="setting"><label>Конечная мощность (Вт):</label><input type="number" value={powerChangeTo} onChange={e => setPowerChangeTo(parseFloat(e.target.value))} /></div></>)}
        {mode === 'rt60' && (<><div className="setting"><label>Объём помещения (м³):</label><input type="number" value={roomVolume} onChange={e => setRoomVolume(parseFloat(e.target.value))} /></div><div className="setting"><label>Площадь поверхностей (м²):</label><input type="number" value={roomArea} onChange={e => setRoomArea(parseFloat(e.target.value))} /></div><div className="setting"><label>Средний коэффициент поглощения:</label><input type="number" step="0.01" value={avgAbsorption} onChange={e => setAvgAbsorption(parseFloat(e.target.value))} /></div></>)}
        {mode === 'speakers' && (<><div className="setting"><label>Требуемый SPL (дБ):</label><input type="number" value={requiredSPL} onChange={e => setRequiredSPL(parseFloat(e.target.value))} /></div><div className="setting"><label>Чувствительность громкоговорителя (дБ):</label><input type="number" value={speakerSensitivity} onChange={e => setSpeakerSensitivity(parseFloat(e.target.value))} /></div><div className="setting"><label>Расстояние (м):</label><input type="number" step="0.1" value={distance} onChange={e => setDistance(parseFloat(e.target.value))} /></div></>)}
        <div className="result-item"><span className="result-label">Результат</span><span className="result-value">{result.text}</span></div>
      </div>
      <div className="calculator-actions">
        <button className="btn-primary" onClick={handleAddToTract}><i className="fas fa-plus"></i> Добавить в тракт</button>
      </div>
    </div>
  );
};
