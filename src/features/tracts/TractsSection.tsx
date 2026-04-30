// src/features/tracts/TractsSection.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { addTract, setActiveTract, setViewMode, Tract } from '../../store/tractsSlice';
import { ActiveTract } from '../../components/calculations/ActiveTract';
import { TractList } from '../../components/calculations/TractList';

interface TractsSectionProps {
  onSelectCalculator: (id: string) => void;
  engine?: any;
}

export const TractsSection: React.FC<TractsSectionProps> = ({ onSelectCalculator, engine }) => {
  const dispatch = useAppDispatch();
  const tracts = useAppSelector(state => state.tracts.tracts);
  const activeTractId = useAppSelector(state => state.tracts.activeTractId);
  const viewMode = useAppSelector(state => state.tracts.viewMode);
  const [newTractName, setNewTractName] = useState('');

  const handleCreateTract = () => {
    if (!newTractName.trim()) return;
    if (engine) {
      engine.addTract(newTractName);
    } else {
      const newTract: Omit<Tract, 'id'> = {
        name: newTractName,
        sourceDevices: [],
        matrixDevices: [],
        sinkDevices: [],
        totalLatency: 0,
        totalBitrate: 0,
        totalPower: 0,
        totalPoE: 0,
        poeBudgetUsed: 0,
      };
      dispatch(addTract(newTract));
    }
    setNewTractName('');
  };

  const handleSelectTract = (id: string) => {
    if (engine) {
      engine.setActiveTractId(id);
      engine.setShowAll(false);
    } else {
      dispatch(setActiveTract(id));
      dispatch(setViewMode('active'));
    }
  };

  const handleBackToList = () => {
    if (engine) {
      engine.setActiveTractId(null);
      engine.setShowAll(true);
    } else {
      dispatch(setViewMode('all'));
    }
  };

  if (viewMode === 'active' && activeTractId) {
    const activeTract = tracts.find(t => t.id === activeTractId);
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

  return (
    <TractList
      tracts={tracts}
      activeTractId={activeTractId}
      newTractName={newTractName}
      onNewTractNameChange={setNewTractName}
      onCreateTract={handleCreateTract}
      onSelectTract={handleSelectTract}
    />
  );
};
