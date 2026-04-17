// src/features/vc/VcSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';

export const VcSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = () => {
    dispatch(setActiveCalculator('vc'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <button className="mode-btn" onClick={openCalculator}>
        <i className="fas fa-calculator"></i> ВКС калькулятор
      </button>
    </div>
  );
};
