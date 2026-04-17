// src/features/video/VideoSection.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { setViewMode, setActiveCalculator } from '../../store/tractsSlice';

export const VideoSection: React.FC = () => {
  const dispatch = useDispatch();

  const openCalculator = () => {
    dispatch(setActiveCalculator('video'));
    dispatch(setViewMode('calculator'));
  };

  return (
    <div className="section-content-inner">
      <button className="mode-btn" onClick={openCalculator}>
        <i className="fas fa-calculator"></i> Видео калькулятор
      </button>
    </div>
  );
};
