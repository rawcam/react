// src/components/calculations/VideoCalculator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setVideoSettings, calcVideoBitrate } from '../../store/videoSlice';
import { addDeviceToTract } from '../../store/tractsSlice';

export const VideoCalculator: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.video);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);
  const bitrate = calcVideoBitrate(settings);

  const handleChange = (field: string, value: any) => {
    dispatch(setVideoSettings({ [field]: value }));
  };

  const handleAddToTract = () => {
    if (!activeTractId) {
      alert('Нет активного тракта. Сначала создайте или выберите тракт.');
      return;
    }
    const newDevice = {
      id: Date.now().toString(),
      type: 'videoSource',
      modelName: `Видеоисточник (${bitrate} Мбит/с)`,
      latency: 0.5,
      poeEnabled: false,
      powerW: 5,
      shortName: `VID${Math.floor(Math.random() * 1000)}`,
      ethernet: true,
      bitrateFactor: 1,
    };
    dispatch(addDeviceToTract({ tractId: activeTractId, device: newDevice, column: 'source' }));
    alert('Устройство добавлено в тракт');
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h3>Видео калькулятор</h3>
        {onBack && <button className="btn-secondary" onClick={onBack}>Назад к трактам</button>}
      </div>
      <div className="calculator-form">
        <div className="setting">
          <label>Разрешение:</label>
          <select value={settings.resolution} onChange={e => handleChange('resolution', e.target.value)}>
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
            <option value="8K">8K</option>
          </select>
        </div>
        <div className="setting">
          <label>Субдискретизация:</label>
          <select value={settings.chroma} onChange={e => handleChange('chroma', e.target.value)}>
            <option value="444">4:4:4</option>
            <option value="422">4:2:2</option>
            <option value="420">4:2:0</option>
          </select>
        </div>
        <div className="setting">
          <label>FPS:</label>
          <select value={settings.fps} onChange={e => handleChange('fps', Number(e.target.value))}>
            <option value="24">24</option>
            <option value="25">25</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="60">60</option>
          </select>
        </div>
        <div className="setting">
          <label>Цветовое пространство:</label>
          <select value={settings.colorSpace} onChange={e => handleChange('colorSpace', e.target.value)}>
            <option value="RGB">RGB</option>
            <option value="YCbCr">YCbCr</option>
          </select>
        </div>
        <div className="setting">
          <label>Глубина цвета (бит):</label>
          <select value={settings.bitDepth} onChange={e => handleChange('bitDepth', Number(e.target.value))}>
            <option value="8">8</option>
            <option value="10">10</option>
            <option value="12">12</option>
          </select>
        </div>
        <div className="setting result">
          <label>Битрейт:</label>
          <span className="network-value">{bitrate} Мбит/с</span>
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
