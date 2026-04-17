// src/features/tracts/TractsSection.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { addTract, setActiveTract, setViewMode, Tract } from '../../store/tractsSlice';
import { ActiveTract } from '../../components/calculations/ActiveTract';
import { TractList } from '../../components/calculations/TractList';
import { VideoCalculator } from '../../components/calculations/VideoCalculator';
import { SoundCalculator } from '../../components/calculations/SoundCalculator';
import { LedCalculator } from '../../components/calculations/LedCalculator';
import { VcCalculator } from '../../components/calculations/VcCalculator';
import { ErgoCalculator } from '../../components/calculations/ErgoCalculator';
import { PowerCalculator } from '../../components/calculations/PowerCalculator';

interface TractsSectionProps {
  onSelectCalculator: (id: string) => void;
}

export const TractsSection: React.FC<TractsSectionProps> = ({ onSelectCalculator }) => {
  const dispatch = useAppDispatch();
  const tracts = useAppSelector(state => state.tracts.tracts);
  const activeTractId = useAppSelector(state => state.tracts.activeTractId);
  const viewMode = useAppSelector(state => state.tracts.viewMode);
  const [newTractName, setNewTractName] = useState('');

  const handleCreateTract = () => {
    if (!newTractName.trim()) return;
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
    setNewTractName('');
  };

  const handleSelectTract = (id: string) => {
    dispatch(setActiveTract(id));
    dispatch(setViewMode('active'));
  };

  const handleBackToList = () => {
    dispatch(setViewMode('all'));
  };

  if (viewMode === 'active' && activeTractId) {
    return <ActiveTract onBack={handleBackToList} onSelectCalculator={onSelectCalculator} />;
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
