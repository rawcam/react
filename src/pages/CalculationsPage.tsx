// src/pages/CalculationsPage.tsx
import React, { useEffect } from 'react';
import { CalculationsLayout } from '../components/layout/CalculationsLayout';
import { TractsSection } from '../features/tracts/TractsSection';
import { VideoCalculator } from '../components/calculations/VideoCalculator';
import { SoundCalculator } from '../components/calculations/SoundCalculator';
import { LedCalculator } from '../components/calculations/LedCalculator';
import { VcCalculator } from '../components/calculations/VcCalculator';
import { ErgoCalculator } from '../components/calculations/ErgoCalculator';
import { PowerCalculator } from '../components/calculations/PowerCalculator';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { setActiveCalculator, setViewMode } from '../store/tractsSlice';
import { useTractEngine } from '../hooks/useTractEngine';

export const CalculationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeCalculator = useAppSelector(state => state.tracts.activeCalculator);
  const engine = useTractEngine();

  // При изменении видео/сетевых настроек пересчитываем все тракты
  useEffect(() => {
    engine.recalcAll();
  }, [useAppSelector(state => state.video), useAppSelector(state => state.network), engine]);

  const handleBack = () => {
    dispatch(setActiveCalculator(null));
    dispatch(setViewMode('all'));
  };

  const renderContent = () => {
    if (activeCalculator) {
      return (
        <div className="calculator-view" style={{ padding: 0 }}>
          <button className="btn-secondary" onClick={handleBack} style={{ marginBottom: 16 }}>
            <i className="fas fa-arrow-left"></i> Назад к трактам
          </button>
          {activeCalculator === 'video' && <VideoCalculator onBack={handleBack} engine={engine} />}
          {activeCalculator === 'sound' && <SoundCalculator onBack={handleBack} engine={engine} />}
          {activeCalculator === 'led' && <LedCalculator onBack={handleBack} engine={engine} />}
          {activeCalculator === 'vc' && <VcCalculator onBack={handleBack} engine={engine} />}
          {activeCalculator === 'ergo' && <ErgoCalculator onBack={handleBack} engine={engine} />}
          {activeCalculator === 'power' && <PowerCalculator onBack={handleBack} engine={engine} />}
        </div>
      );
    }

    const showEmpty = engine.tracts.length === 0;
    if (showEmpty) {
      return (
        <div className="empty-calculations">
          <i className="fas fa-calculator"></i>
          <h3>Начните работу</h3>
          <p>
            Выберите один из калькуляторов (<strong>LED, звук, ВКС, эргономика, питание</strong>) в сайдбаре,<br />
            или создайте тракт для построения AV‑цепочки.
          </p>
          <small>Все расчёты сохраняются автоматически.</small>
        </div>
      );
    }

    return (
      <div className="calculations-main">
        <TractsSection
          engine={engine}
          onSelectCalculator={(id) => {
            dispatch(setActiveCalculator(id));
            dispatch(setViewMode('calculator'));
          }}
        />
      </div>
    );
  };

  return (
    <CalculationsLayout sidebarCollapsed={false} onToggleSidebar={() => {}}>
      {renderContent()}
    </CalculationsLayout>
  );
};
