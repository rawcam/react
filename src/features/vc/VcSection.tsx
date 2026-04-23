// src/features/vc/VcSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';
import { setVcMode } from '../../store/vcSlice';

export const VcSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = (mode: 'codec' | 'multipoint') => {
    dispatch(setVcMode(mode));
    dispatch(setActiveCalculator('vc'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <div className="mode-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="mode-btn" onClick={() => openCalculator('codec')}>
          <i className="fas fa-satellite-dish"></i> Расчёт битрейта кодеков
        </button>
        <button className="mode-btn" onClick={() => openCalculator('multipoint')}>
          <i className="fas fa-users"></i> Многоточечный вызов
        </button>
      </div>
    </div>
  );
};
