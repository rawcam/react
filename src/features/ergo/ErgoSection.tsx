// src/features/ergo/ErgoSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';

export const ErgoSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = () => {
    dispatch(setActiveCalculator('ergo'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <button className="mode-btn" onClick={openCalculator}>
        <i className="fas fa-calculator"></i> Эргономика ЭКП
      </button>
    </div>
  );
};
