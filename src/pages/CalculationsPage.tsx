// src/pages/CalculationsPage.tsx
import React, { useState } from 'react';
import { CalculationsLayout } from '../components/layout/CalculationsLayout';
import { TractsSection } from '../features/tracts/TractsSection';
import { VideoCalculator } from '../components/calculations/VideoCalculator';
import { SoundCalculator } from '../components/calculations/SoundCalculator';
import { LedCalculator } from '../components/calculations/LedCalculator';
import { VcCalculator } from '../components/calculations/VcCalculator';
import { ErgoCalculator } from '../components/calculations/ErgoCalculator';
import { PowerCalculator } from '../components/calculations/PowerCalculator';
import { useAppSelector } from '../hooks/hooks';

export const CalculationsPage: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const viewMode = useAppSelector(state => state.tracts.viewMode);
  const activeTractId = useAppSelector(state => state.tracts.activeTractId);
  const tracts = useAppSelector(state => state.tracts.tracts);
  const activeTract = tracts.find(t => t.id === activeTractId);

  const handleSelectCalculator = (id: string) => {
    setActiveCalculator(id);
  };

  const handleBack = () => {
    setActiveCalculator(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Если открыт конкретный калькулятор
  if (activeCalculator) {
    return (
      <div className="calculator-view">
        <button className="btn-secondary" onClick={handleBack} style={{ marginBottom: 16 }}>
          <i className="fas fa-arrow-left"></i> Назад к трактам
        </button>
        {activeCalculator === 'video' && <VideoCalculator onBack={handleBack} />}
        {activeCalculator === 'sound' && <SoundCalculator onBack={handleBack} />}
        {activeCalculator === 'led' && <LedCalculator onBack={handleBack} />}
        {activeCalculator === 'vc' && <VcCalculator onBack={handleBack} />}
        {activeCalculator === 'ergo' && <ErgoCalculator onBack={handleBack} />}
        {activeCalculator === 'power' && <PowerCalculator onBack={handleBack} />}
      </div>
    );
  }

  // Определяем, нужно ли показать пустое состояние
  const showEmptyState = viewMode === 'all' ? tracts.length === 0 : !activeTract;

  return (
    <CalculationsLayout sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar}>
      {showEmptyState ? (
        <div className="empty-calculations">
          <i className="fas fa-calculator"></i>
          <h3>Начните работу</h3>
          <p>
            Выберите один из калькуляторов (<strong>LED, звук, ВКС, эргономика, питание</strong>) в сайдбаре,<br />
            или создайте тракт для построения AV‑цепочки.
          </p>
          <small>Все расчёты сохраняются автоматически.</small>
        </div>
      ) : (
        <div className="calculations-main">
          <TractsSection onSelectCalculator={handleSelectCalculator} />
        </div>
      )}
    </CalculationsLayout>
  );
};
