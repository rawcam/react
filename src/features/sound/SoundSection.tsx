// src/features/sound/SoundSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';

export const SoundSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = () => {
    dispatch(setActiveCalculator('sound'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <button className="mode-btn" onClick={openCalculator}>
        <i className="fas fa-calculator"></i> Звуковой калькулятор
      </button>
    </div>
  );
};
