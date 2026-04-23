// src/features/led/LedSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';
import { setLedMode } from '../../store/ledSlice';

export const LedSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = (mode: 'cabinets' | 'resolution') => {
    dispatch(setLedMode(mode));
    dispatch(setActiveCalculator('led'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <div className="mode-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="mode-btn" onClick={() => openCalculator('cabinets')}>
          <i className="fas fa-th-large"></i> По кабинетам
        </button>
        <button className="mode-btn" onClick={() => openCalculator('resolution')}>
          <i className="fas fa-bullseye"></i> По разрешению
        </button>
      </div>
    </div>
  );
};
