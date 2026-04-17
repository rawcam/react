// src/components/calculations/VcCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setVcConfig } from '../../store/vcSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

export const VcCalculator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch();
  const vc = useSelector((state: RootState) => state.vc);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);

  const [mode, setMode] = useState(vc.activeMode);
  const [codecPreset, setCodecPreset] = useState(vc.codecPreset);
  const [resolution, setResolution] = useState(vc.resolution);
  const [fps, setFps] = useState(vc.fps);
  const [participants, setParticipants] = useState(vc.participants);
  const [multipointParticipants, setMultipointParticipants] = useState(vc.multipointParticipants);
  const [result, setResult] = useState({ value: vc.resultValue, text: vc.resultText });

  useEffect(() => {
    const config: any = { activeMode: mode };
    if (mode === 'codec') {
      config.codecPreset = codecPreset;
      config.resolution = resolution;
      config.fps = fps;
      config.participants = participants;
    } else {
      config.multipointParticipants = multipointParticipants;
    }
    dispatch(setVcConfig(config));
  }, [mode, codecPreset, resolution, fps, participants, multipointParticipants, dispatch]);

  useEffect(() => {
    setResult({ value: vc.resultValue, text: vc.resultText });
  }, [vc]);

  const handleAddToTract = () => {
    if (!activeTractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'vcDevice',
      modelName: `Кодек ВКС (${result.text})`,
      latency: 0,
      poeEnabled: false,
      powerW: 0,
      shortName: `VC${Math.floor(Math.random() * 1000)}`,
      ethernet: true,
    };
    dispatch(addDeviceToTract({ tractId: activeTractId, device: newDevice, column: 'sink' }));
    alert('Устройство добавлено в тракт');
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>ВКС калькулятор</h3>
        <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>
      </div>
      <div className="calculator-form">
        <div className="setting">
          <label>Режим:</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="codec">Расчёт битрейта кодеков</option>
            <option value="multipoint">Многоточечный вызов</option>
          </select>
        </div>

        {mode === 'codec' && (
          <>
            <div className="setting"><label>Кодек:</label>
              <select value={codecPreset} onChange={e => setCodecPreset(e.target.value)}>
                <option value="trueconf">TrueConf</option>
                <option value="webrtc">WebRTC</option>
                <option value="h264">H.264</option>
                <option value="h265">H.265</option>
              </select>
            </div>
            <div className="setting"><label>Разрешение:</label>
              <select value={resolution} onChange={e => setResolution(e.target.value)}>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div className="setting"><label>FPS:</label><input type="number" value={fps} onChange={e => setFps(parseInt(e.target.value))} /></div>
            <div className="setting"><label>Количество участников:</label><input type="number" value={participants} onChange={e => setParticipants(parseInt(e.target.value))} /></div>
          </>
        )}

        {mode === 'multipoint' && (
          <div className="setting"><label>Количество участников:</label><input type="number" value={multipointParticipants} onChange={e => setMultipointParticipants(parseInt(e.target.value))} /></div>
        )}

        <div className="result-item">
          <span className="result-label">Результат</span>
          <span className="result-value">{result.text}</span>
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
