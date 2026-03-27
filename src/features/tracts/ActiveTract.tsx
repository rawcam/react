import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { addTract, setActiveTract } from '../../store/tractsSlice'

export const ActiveTract = () => {
  const dispatch = useDispatch()
  const activeTractId = useSelector((state: RootState) => state.tracts.activeTractId)
  const tracts = useSelector((state: RootState) => state.tracts.tracts)
  const activeTract = tracts.find(t => t.id === activeTractId)

  const handleNewTract = () => {
    const newTract = {
      id: Date.now().toString(),
      name: `Тракт ${tracts.length + 1}`,
      sourceDevices: [],
      sinkDevices: [],
      totalLatency: 0,
      totalPower: 0,
      totalBitrate: 0,
    }
    dispatch(addTract(newTract))
    dispatch(setActiveTract(newTract.id))
  }

  return (
    <div className="active-tract-container">
      <button className="btn-primary" onClick={handleNewTract}>
        <i className="fas fa-plus"></i> Новый тракт
      </button>
      {activeTract ? (
        <div>
          <h3>{activeTract.name}</h3>
          {/* Здесь будет детальная информация о тракте */}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-road"></i>
          <h3>Нет активного тракта</h3>
          <p>Создайте новый тракт, чтобы начать работу</p>
          <button className="btn-primary" onClick={handleNewTract}>
            <i className="fas fa-plus"></i> Новый тракт
          </button>
        </div>
      )}
    </div>
  )
}
