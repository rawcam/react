// src/features/projects/ProjectDetail.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectStatus, ProjectCategory, IncomeItem, ExpenseItem } from '../../store/projectsSlice';
import { useFinance } from '../../hooks/useFinance';
import { useProjectsSupabase } from '../../hooks/useProjectsSupabase';
import { RootState } from '../../store';
import { updateSpecification, deleteSpecification, addSpecification } from '../../store/specificationsSlice';
import { getSpecTotalRub } from '../../utils/specificationUtils';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const { updateProjectInDb } = useProjectsSupabase();
  const { getProjectMetrics } = useFinance();
  const metrics = getProjectMetrics(project.id);
  const [activeTab, setActiveTab] = useState<'info' | 'finances' | 'service' | 'roadmap' | 'specs'>('info');
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const specifications = useSelector((state: RootState) => state.specifications.list);
  const { usdRate, eurRate } = useSelector((state: RootState) => state.currency);

  const projectSpecs = specifications.filter(spec => spec.projectId === project.id);

  const [newMeeting, setNewMeeting] = useState({ date: new Date().toISOString().slice(0,10), subject: '' });
  const [newPurchase, setNewPurchase] = useState({ name: '', status: 'awaiting_payment', date: new Date().toISOString().slice(0,10) });
  const [newIncome, setNewIncome] = useState({ date: new Date().toISOString().slice(0,10), amount: 0 });
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().slice(0,10), amount: 0, type: 'purchase' as const });
  const [newService, setNewService] = useState({
    date: new Date().toISOString().slice(0,10),
    type: '',
    status: 'planned' as const,
    responsible: '',
    cost: 0
  });

  // ... все обработчики (handleOpenSpec, handleUnlinkSpec, handleDeleteSpec, handleDuplicateSpec, handleCreateSpecForProject,
  // handleChange, handleSave, addMeeting, removeMeeting, addPurchase, removePurchase,
  // addIncome, updateIncome, removeIncome, addExpense, updateExpense, removeExpense, addService)
  // остаются без изменений

  const statusColors: Record<string, string> = {
    presale: '#f59e0b',
    design: '#3b82f6',
    ready: '#10b981',
    construction: '#8b5cf6',
    done: '#6b7280',
  };

  const purchaseStatusOptions = [
    { value: 'awaiting_payment', label: 'Ожидает оплаты' },
    { value: 'paid', label: 'Оплачено' },
    { value: 'reserved', label: 'Зарезервировано' },
    { value: 'ordered', label: 'Заказано' },
    { value: 'in_transit', label: 'В пути' },
    { value: 'delivered', label: 'Доставлено' },
    { value: 'cancelled', label: 'Отменено' },
    { value: 'out_of_stock', label: 'Нет в наличии' },
  ];

  const expenseTypeOptions = [
    { value: 'purchase', label: 'Закупка оборудования' },
    { value: 'salary', label: 'Зарплата' },
    { value: 'subcontractor', label: 'Подрядчики' },
    { value: 'rent', label: 'Аренда' },
  ];

  return (
    <div className="project-detail-card">
      <button className="btn-secondary" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Назад
      </button>
      <h2>[{editedProject.shortId}] {editedProject.name}</h2>
      <div className="detail-tabs">
        <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
          Общая информация
        </button>
        <button className={activeTab === 'finances' ? 'active' : ''} onClick={() => setActiveTab('finances')}>
          Финансы
        </button>
        <button className={activeTab === 'service' ? 'active' : ''} onClick={() => setActiveTab('service')}>
          Сервис
        </button>
        <button className={activeTab === 'roadmap' ? 'active' : ''} onClick={() => setActiveTab('roadmap')}>
          Дорожная карта
        </button>
        <button className={activeTab === 'specs' ? 'active' : ''} onClick={() => setActiveTab('specs')}>
          Спецификации
        </button>
      </div>

      {activeTab === 'info' && (
        // ... вкладка info без изменений ...
      )}

      {activeTab === 'finances' && (
        // ... вкладка finances без изменений ...
      )}

      {activeTab === 'service' && (
        // ... вкладка service без изменений ...
      )}

      {activeTab === 'roadmap' && (
        <div className="detail-section">
          <h4>Дорожная карта (план/факт)</h4>
          {/* Графический информер */}
          <div className="roadmap-timeline">
            {editedProject.roadmapPlanned.map((item, idx) => {
              const actual = editedProject.roadmapActual[idx];
              const plannedStart = item.date;
              const actualStart = actual?.date;
              const plannedEnd = item.endDate || ''; // добавлено поле endDate в RoadmapItem (нужно расширить тип)
              const actualEnd = actual?.endDate || '';
              const isStarted = !!actualStart;
              const isCompleted = !!actualEnd;
              const isLate = actualStart && new Date(actualStart) > new Date(plannedStart);
              return (
                <div key={idx} className={`timeline-item ${isCompleted ? (isLate ? 'late' : 'completed') : (isStarted ? 'started' : '')}`}>
                  <div className="timeline-status">{item.status}</div>
                  <div className="timeline-dates">
                    <div className="date-row">
                      <span className="date-label">План начало:</span>
                      <span className="date-value">{plannedStart}</span>
                    </div>
                    {actualStart && (
                      <div className="date-row">
                        <span className="date-label">Факт начало:</span>
                        <span className="date-value">{actualStart}</span>
                      </div>
                    )}
                    <div className="date-row">
                      <span className="date-label">План завершение:</span>
                      <span className="date-value">{plannedEnd || '—'}</span>
                    </div>
                    {actualEnd && (
                      <div className="date-row">
                        <span className="date-label">Факт завершение:</span>
                        <span className="date-value">{actualEnd}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <table className="roadmap-table">
            <thead>
              <tr>
                <th>Этап</th>
                <th>План начало</th>
                <th>Факт начало</th>
                <th>План завершение</th>
                <th>Факт завершение</th>
              </tr>
            </thead>
            <tbody>
              {editedProject.roadmapPlanned.map((item, idx) => {
                const actual = editedProject.roadmapActual[idx];
                return (
                  <tr key={idx}>
                    <td>{item.status}</td>
                    <td>
                      <input
                        type="date"
                        value={item.date}
                        onChange={e => {
                          const newPlanned = [...editedProject.roadmapPlanned];
                          newPlanned[idx].date = e.target.value;
                          setEditedProject(prev => ({ ...prev, roadmapPlanned: newPlanned }));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={actual?.date || ''}
                        onChange={e => {
                          const newActual = [...editedProject.roadmapActual];
                          newActual[idx] = { ...newActual[idx], status: item.status, date: e.target.value };
                          setEditedProject(prev => ({ ...prev, roadmapActual: newActual }));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.endDate || ''}
                        onChange={e => {
                          const newPlanned = [...editedProject.roadmapPlanned];
                          newPlanned[idx].endDate = e.target.value;
                          setEditedProject(prev => ({ ...prev, roadmapPlanned: newPlanned }));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={actual?.endDate || ''}
                        onChange={e => {
                          const newActual = [...editedProject.roadmapActual];
                          newActual[idx] = { ...newActual[idx], endDate: e.target.value };
                          setEditedProject(prev => ({ ...prev, roadmapActual: newActual }));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'specs' && (
        // ... вкладка specs без изменений ...
      )}

      <div className="detail-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};
