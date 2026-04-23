// src/pages/CalculationsPage.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setViewMode, setActiveCalculator } from '../store/tractsSlice';
import { Sidebar } from '../components/layout/Sidebar';
import { ActiveTract } from '../features/tracts/ActiveTract';
import { AllTractsView } from '../features/tracts/AllTractsView';
import { LedCalculator } from '../components/calculations/LedCalculator';
import { SoundCalculator } from '../components/calculations/SoundCalculator';
import { VcCalculator } from '../components/calculations/VcCalculator';
import { ErgoCalculator } from '../components/calculations/ErgoCalculator';
import { PowerCalculator } from '../components/calculations/PowerCalculator';
import './CalculationsPage.css';

export const CalculationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const viewMode = useSelector((state: RootState) => state.tracts.viewMode);
  const activeCalculator = useSelector((state: RootState) => state.tracts.activeCalculator);
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId);
  const tracts = useSelector((state: RootState) => state.tracts.tracts);
  const activeTract = tracts.find(t => t.id === activeTractId);

  const handleBackFromCalculator = () => {
    dispatch(setViewMode('single'));
    dispatch(setActiveCalculator(null));
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'led': return <LedCalculator onBack={handleBackFromCalculator} />;
      case 'sound': return <SoundCalculator onBack={handleBackFromCalculator} />;
      case 'vc': return <VcCalculator onBack={handleBackFromCalculator} />;
      case 'ergo': return <ErgoCalculator onBack={handleBackFromCalculator} />;
      case 'power': return <PowerCalculator onBack={handleBackFromCalculator} />;
      default: return null;
    }
  };

  // Режим "Все тракты"
  if (viewMode === 'all') {
    return (
      <div className="calculations-layout normal-mode">
        <Sidebar />
        <div className="main-content">
          <h2>Расчёты</h2>
          <AllTractsView />
        </div>
      </div>
    );
  }

  // Режим калькулятора
  if (viewMode === 'calculator' && activeCalculator) {
    return (
      <div className="calculations-layout normal-mode">
        <Sidebar />
        <div className="main-content">
          <h2>Расчёты</h2>
          {renderCalculator()}
        </div>
      </div>
    );
  }

  // Режим одного тракта
  if (viewMode === 'single' && activeTract) {
    return (
      <div className="calculations-layout normal-mode">
        <Sidebar />
        <div className="main-content">
          <h2>Расчёты</h2>
          <ActiveTract />
        </div>
      </div>
    );
  }

  // Пустое состояние (центрируем)
  return (
    <div className="calculations-layout empty-mode">
      <Sidebar />
      <div className="main-content">
        <div className="empty-calculations">
          <i className="fas fa-calculator"></i>
          <h3>Начните работу</h3>
          <p>
            Выберите один из калькуляторов (<strong>LED, звук, ВКС, эргономика, питание</strong>) в сайдбаре,<br />
            или создайте тракт для построения AV‑цепочки.
          </p>
          <small>Все расчёты сохраняются автоматически.</small>
        </div>
      </div>
    </div>
  );
};
