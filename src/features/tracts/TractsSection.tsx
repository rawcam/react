// src/features/tracts/TractsSection.tsx
import React, { useState } from 'react';
import { useTractEngine } from '../../hooks/useTractEngine';
import { ActiveTract } from '../../components/calculations/ActiveTract';
import { TractList } from '../../components/calculations/TractList';

interface TractsSectionProps {
  engine: ReturnType<typeof useTractEngine>;
  onSelectCalculator: (id: string) => void;
}

export const TractsSection: React.FC<TractsSectionProps> = ({ engine, onSelectCalculator }) => {
  const [newTractName, setNewTractName] = useState('');

  const handleCreateTract = () => {
    const name = newTractName.trim();
    if (!name) return;
    engine.addTract(name);
    setNewTractName('');
  };

  const handleSelectTract = (id: string) => {
    engine.setActiveTractId(id);
    engine.setShowAll(false);
  };

  const handleBackToList = () => {
    engine.setActiveTractId(null);
    engine.setShowAll(true);
  };

  // Если активен конкретный тракт, показываем его
  if (engine.activeTractId && !engine.showAll) {
    const activeTract = engine.tracts.find(t => t.id === engine.activeTractId);
    if (activeTract) {
      return (
        <ActiveTract
          tract={activeTract}
          engine={engine}
          onBack={handleBackToList}
          onSelectCalculator={onSelectCalculator}
        />
      );
    }
  }

  // Иначе показываем список всех трактов
  return (
    <TractList
      tracts={engine.tracts}
      activeTractId={engine.activeTractId}
      newTractName={newTractName}
      onNewTractNameChange={setNewTractName}
      onCreateTract={handleCreateTract}
      onSelectTract={handleSelectTract}
    />
  );
};
