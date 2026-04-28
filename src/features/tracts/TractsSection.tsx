// src/features/tracts/TractsSection.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { addTract, setActiveTract, setViewMode, Tract } from '../../store/tractsSlice';
import { ActiveTract } from '../../components/calculations/ActiveTract';
import { TractList } from '../../components/calculations/TractList';

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
    const name = newTractName.trim();
    if (!name) return;

    // Генерируем id сразу, чтобы активировать после добавления
    const newId = Date.now().toString();
    const newTract: Omit<Tract, 'id'> = {
      name,
      sourceDevices: [],
      matrixDevices: [],
      sinkDevices: [],
      totalLatency: 0,
      totalBitrate: 0,
      totalPower: 0,
      totalPoE: 0,
      poeBudgetUsed: 0,
    };

    dispatch(addTract({ ...newTract, id: newId })); // слайс ожидает id? нужно проверить
    // Если слайс ожидает Omit<Tract, 'id'>, то передаём без id
    // Но мы можем просто диспатч addTract, а потом активировать
    // Для надёжности: сначала диспатч addTract с id (изменим слайс)
    // Или используем setTimeout для чтения нового тракта
    dispatch(setActiveTract(newId));
    dispatch(setViewMode('active'));
    setNewTractName('');
  };

  const handleSelectTract = (id: string) => {
    dispatch(setActiveTract(id));
    dispatch(setViewMode('active'));
  };

  const handleBackToList = () => {
    dispatch(setActiveTract(null));
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
