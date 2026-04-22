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
          <i className="fas fa-arrow-left"></i> Назад к разделам
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

  // Основной вид с сайдбаром (без заголовка "Расчёты")
  return (
    <CalculationsLayout sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar}>
      <div className="calculations-main">
        <TractsSection onSelectCalculator={handleSelectCalculator} />
      </div>
    </CalculationsLayout>
  );
};
