// src/components/projects/ProjectDetail.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectStatus, ProjectCategory, IncomeItem, ExpenseItem } from '../../store/projectsSlice';
import { useFinance } from '../../hooks/useFinance';
import { useProjectsDb } from '../../hooks/useProjectsDb';
import { RootState } from '../../store';
import { updateSpecification, deleteSpecification, addSpecification } from '../../store/specificationsSlice';
import { getSpecTotalRub } from '../../utils/specificationUtils';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const { updateProjectInDb } = useProjectsDb();
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

  const handleOpenSpec = (id: string) => {
    navigate(`/specification/${id}`);
  };

  const handleUnlinkSpec = (id: string) => {
    if (confirm('Открепить спецификацию от проекта? Она останется в общем списке без привязки.')) {
      dispatch(updateSpecification({ id, updates: { projectId: null } }));
    }
  };

  const handleDeleteSpec = (id: string) => {
    if (confirm('Удалить спецификацию? Это действие необратимо.')) {
      dispatch(deleteSpecification(id));
    }
  };

  const handleDuplicateSpec = (spec: any) => {
    const newId = Date.now().toString();
    const now = new Date().toISOString();
    const newSpec = {
      ...spec,
      id: newId,
      name: `${spec.name} (копия)`,
      projectId: null,
      createdAt: now,
      updatedAt: now,
    };
    dispatch(addSpecification(newSpec));
    navigate(`/specification/${newId}`);
  };

  const handleCreateSpecForProject = () => {
    const newId = Date.now().toString();
    const now = new Date().toISOString();
    dispatch(addSpecification({
      id: newId,
      name: `Новая спецификация для проекта ${project.shortId}`,
      projectId: null,
      createdAt: now,
      updatedAt: now,
      rows: [],
    }));
    navigate(`/specification/${newId}`);
  };

  const handleChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProjectInDb(editedProject);
      alert('Сохранено');
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const addMeeting = () => {
    if (!newMeeting.subject.trim()) return;
    setEditedProject(prev => ({
      ...prev,
      meetings: [...prev.meetings, { date: newMeeting.date, subject: newMeeting.subject }]
    }));
    setNewMeeting({ date: new Date().toISOString().slice(0,10), subject: '' });
  };

  const removeMeeting = (index: number) => {
    setEditedProject(prev => ({
      ...prev,
      meetings: prev.meetings.filter((_, i) => i !== index)
    }));
  };

  const addPurchase = () => {
    if (!newPurchase.name.trim()) return;
    setEditedProject(prev => ({
      ...prev,
      purchases: [...prev.purchases, { name: newPurchase.name, status: newPurchase.status, date: newPurchase.date }]
    }));
    setNewPurchase({ name: '', status: 'awaiting_payment', date: new Date().toISOString().slice(0,10) });
  };

  const removePurchase = (index: number) => {
    setEditedProject(prev => ({
      ...prev,
      purchases: prev.purchases.filter((_, i) => i !== index)
    }));
  };

  const addIncome = () => {
    if (newIncome.amount <= 0) return;
    setEditedProject(prev => ({
      ...prev,
      incomeSchedule: [...prev.incomeSchedule, { date: newIncome.date, amount: newIncome.amount, paid: false }]
    }));
    setNewIncome({ date: new Date().toISOString().slice(0,10), amount: 0 });
  };

  const updateIncome = (index: number, field: keyof IncomeItem, value: any) => {
    const newIncomes = [...editedProject.incomeSchedule];
    newIncomes[index] = { ...newIncomes[index], [field]: value };
    if (field === 'paid') {
      const actualIncome = newIncomes.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
      setEditedProject(prev => ({ ...prev, incomeSchedule: newIncomes, actualIncome }));
    } else {
      setEditedProject(prev => ({ ...prev, incomeSchedule: newIncomes }));
    }
  };

  const removeIncome = (index: number) => {
    const newIncomes = editedProject.incomeSchedule.filter((_, i) => i !== index);
    const actualIncome = newIncomes.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
    setEditedProject(prev => ({ ...prev, incomeSchedule: newIncomes, actualIncome }));
  };

  const addExpense = () => {
    if (newExpense.amount <= 0) return;
    setEditedProject(prev => ({
      ...prev,
      expenseSchedule: [...prev.expenseSchedule, { date: newExpense.date, amount: newExpense.amount, type: newExpense.type, paid: false }]
    }));
    setNewExpense({ date: new Date().toISOString().slice(0,10), amount: 0, type: 'purchase' });
  };

  const updateExpense = (index: number, field: keyof ExpenseItem, value: any) => {
    const newExpenses = [...editedProject.expenseSchedule];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    if (field === 'paid') {
      const actualExpenses = newExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
      setEditedProject(prev => ({ ...prev, expenseSchedule: newExpenses, actualExpenses }));
    } else {
      setEditedProject(prev => ({ ...prev, expenseSchedule: newExpenses }));
    }
  };

  const removeExpense = (index: number) => {
    const newExpenses = editedProject.expenseSchedule.filter((_, i) => i !== index);
    const actualExpenses = newExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    setEditedProject(prev => ({ ...prev, expenseSchedule: newExpenses, actualExpenses }));
  };

  const addService = () => {
    if (!newService.type.trim()) return;
    const newId = Date.now().toString();
    setEditedProject(prev => ({
      ...prev,
      serviceVisits: [...prev.serviceVisits, { ...newService, id: newId }]
    }));
    setNewService({
      date: new Date().toISOString().slice(0,10),
      type: '',
      status: 'planned',
      responsible: '',
      cost: 0
    });
  };

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
        <>
          <div className="detail-form">
            <div className="detail-field">
              <label>Название:</label>
              <input type="text" value={editedProject.name} onChange={e => handleChange('name', e.target.value)} />
            </div>
            <div className="detail-field">
              <label>Категория:</label>
              <select value={editedProject.category} onChange={e => handleChange('category', e.target.value as ProjectCategory)}>
                <option value="new">Новый (0000–1999)</option>
                <option value="modernization">Модернизация (2000–3999)</option>
                <option value="service">Сервис (4000–5999)</option>
                <option value="standard">Типовой (6000–7999)</option>
                <option value="pilot">Пилот (8000–9999)</option>
              </select>
            </div>
            <div className="detail-field">
              <label>Статус:</label>
              <select value={editedProject.status} onChange={e => handleChange('status', e.target.value as ProjectStatus)} style={{ background: statusColors[editedProject.status] || '#ccc', color: 'white' }}>
                <option value="presale">Пресейл</option>
                <option value="design">Стадия П</option>
                <option value="ready">Стадия Р</option>
                <option value="construction">Монтаж</option>
                <option value="done">Завершён</option>
              </select>
            </div>
            <div className="detail-field">
              <label>Сумма контракта (₽):</label>
              <input type="number" value={editedProject.contractAmount} onChange={e => handleChange('contractAmount', Number(e.target.value))} />
            </div>
            <div className="detail-field">
              <label>Инженер:</label>
              <input type="text" value={editedProject.engineer} onChange={e => handleChange('engineer', e.target.value)} />
            </div>
            <div className="detail-field">
              <label>Руководитель проекта:</label>
              <input type="text" value={editedProject.projectManager} onChange={e => handleChange('projectManager', e.target.value)} />
            </div>
            <div className="detail-field">
              <label>Дата начала:</label>
              <input type="date" value={editedProject.startDate} onChange={e => handleChange('startDate', e.target.value)} />
            </div>
            <div className="detail-field">
              <label>Прогресс (%):</label>
              <input type="number" min="0" max="100" value={editedProject.progress} onChange={e => handleChange('progress', Number(e.target.value))} />
            </div>
            <div className="detail-field checkbox">
              <label><input type="checkbox" checked={editedProject.priority} onChange={e => handleChange('priority', e.target.checked)} /> Срочный проект</label>
            </div>
          </div>

          <div className="detail-section">
            <h4>Встречи</h4>
            <div className="detail-list">
              {editedProject.meetings.map((meeting, idx) => (
                <div key={idx} className="list-item">
                  <input type="date" value={meeting.date} onChange={e => {
                    const newMeetings = [...editedProject.meetings];
                    newMeetings[idx].date = e.target.value;
                    setEditedProject(prev => ({ ...prev, meetings: newMeetings }));
                  }} />
                  <input type="text" value={meeting.subject} onChange={e => {
                    const newMeetings = [...editedProject.meetings];
                    newMeetings[idx].subject = e.target.value;
                    setEditedProject(prev => ({ ...prev, meetings: newMeetings }));
                  }} placeholder="Тема встречи" />
                  <button className="remove-item" onClick={() => removeMeeting(idx)}><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
              <div className="add-item-form">
                <input type="date" value={newMeeting.date} onChange={e => setNewMeeting(prev => ({ ...prev, date: e.target.value }))} />
                <input type="text" value={newMeeting.subject} onChange={e => setNewMeeting(prev => ({ ...prev, subject: e.target.value }))} placeholder="Тема новой встречи" />
                <button className="btn-small" onClick={addMeeting}>+ Добавить</button>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Закупки</h4>
            <div className="detail-list">
              {editedProject.purchases.map((purchase, idx) => (
                <div key={idx} className="list-item">
                  <input type="text" value={purchase.name} onChange={e => {
                    const newPurchases = [...editedProject.purchases];
                    newPurchases[idx].name = e.target.value;
                    setEditedProject(prev => ({ ...prev, purchases: newPurchases }));
                  }} placeholder="Наименование" />
                  <select value={purchase.status} onChange={e => {
                    const newPurchases = [...editedProject.purchases];
                    newPurchases[idx].status = e.target.value;
                    setEditedProject(prev => ({ ...prev, purchases: newPurchases }));
                  }}>
                    {purchaseStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <input type="date" value={purchase.date} onChange={e => {
                    const newPurchases = [...editedProject.purchases];
                    newPurchases[idx].date = e.target.value;
                    setEditedProject(prev => ({ ...prev, purchases: newPurchases }));
                  }} />
                  <button className="remove-item" onClick={() => removePurchase(idx)}><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
              <div className="add-item-form">
                <input type="text" value={newPurchase.name} onChange={e => setNewPurchase(prev => ({ ...prev, name: e.target.value }))} placeholder="Наименование закупки" />
                <select value={newPurchase.status} onChange={e => setNewPurchase(prev => ({ ...prev, status: e.target.value }))}>
                  {purchaseStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input type="date" value={newPurchase.date} onChange={e => setNewPurchase(prev => ({ ...prev, date: e.target.value }))} />
                <button className="btn-small" onClick={addPurchase}>+ Добавить</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'finances' && (
        <div>
          <div className="detail-section">
            <h4>Доходы (поступления)</h4>
            <div className="detail-list">
              {editedProject.incomeSchedule.map((income, idx) => (
                <div key={idx} className="list-item">
                  <input type="date" value={income.date} onChange={e => updateIncome(idx, 'date', e.target.value)} />
                  <input type="number" value={income.amount} onChange={e => updateIncome(idx, 'amount', Number(e.target.value))} placeholder="Сумма" />
                  <label><input type="checkbox" checked={income.paid || false} onChange={e => updateIncome(idx, 'paid', e.target.checked)} /> Оплачено</label>
                  <button className="remove-item" onClick={() => removeIncome(idx)}><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
              <div className="add-item-form">
                <input type="date" value={newIncome.date} onChange={e => setNewIncome(prev => ({ ...prev, date: e.target.value }))} />
                <input type="number" value={newIncome.amount} onChange={e => setNewIncome(prev => ({ ...prev, amount: Number(e.target.value) }))} placeholder="Сумма" />
                <button className="btn-small" onClick={addIncome}>+ Добавить доход</button>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Расходы (затраты)</h4>
            <div className="detail-list">
              {editedProject.expenseSchedule.map((expense, idx) => (
                <div key={idx} className="list-item">
                  <input type="date" value={expense.date} onChange={e => updateExpense(idx, 'date', e.target.value)} />
                  <input type="number" value={expense.amount} onChange={e => updateExpense(idx, 'amount', Number(e.target.value))} placeholder="Сумма" />
                  <select value={expense.type} onChange={e => updateExpense(idx, 'type', e.target.value as any)}>
                    {expenseTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <label><input type="checkbox" checked={expense.paid || false} onChange={e => updateExpense(idx, 'paid', e.target.checked)} /> Оплачено</label>
                  <button className="remove-item" onClick={() => removeExpense(idx)}><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
              <div className="add-item-form">
                <input type="date" value={newExpense.date} onChange={e => setNewExpense(prev => ({ ...prev, date: e.target.value }))} />
                <input type="number" value={newExpense.amount} onChange={e => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))} placeholder="Сумма" />
                <select value={newExpense.type} onChange={e => setNewExpense(prev => ({ ...prev, type: e.target.value as any }))}>
                  {expenseTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button className="btn-small" onClick={addExpense}>+ Добавить расход</button>
              </div>
            </div>
          </div>

          {metrics && (
            <div className="detail-section">
              <h4>Аналитика</h4>
              <p><strong>Плановая маржа:</strong> {metrics.margins.plannedMargin.toLocaleString()} ₽</p>
              <p><strong>Плановая рентабельность:</strong> {(metrics.margins.plannedProfitability * 100).toFixed(1)}%</p>
              <p><strong>Фактическая маржа:</strong> {metrics.margins.actualMargin.toLocaleString()} ₽</p>
              <p><strong>Фактическая рентабельность:</strong> {(metrics.margins.actualProfitability * 100).toFixed(1)}%</p>
              <details>
                <summary>График денежных потоков</summary>
                <pre>{JSON.stringify(metrics.cashFlow, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      {activeTab === 'service' && (
        <div>
          <h3>Сервисные работы</h3>
          <div className="detail-list">
            {editedProject.serviceVisits.map((visit, idx) => (
              <div key={visit.id} className="list-item">
                <input type="date" value={visit.date} onChange={e => {
                  const newVisits = [...editedProject.serviceVisits];
                  newVisits[idx].date = e.target.value;
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }} />
                <input type="text" value={visit.type} onChange={e => {
                  const newVisits = [...editedProject.serviceVisits];
                  newVisits[idx].type = e.target.value;
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }} placeholder="Тип работ" />
                <select value={visit.status} onChange={e => {
                  const newVisits = [...editedProject.serviceVisits];
                  newVisits[idx].status = e.target.value as any;
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }}>
                  <option value="planned">Запланировано</option>
                  <option value="completed">Выполнено</option>
                  <option value="cancelled">Отменено</option>
                </select>
                <input type="text" value={visit.responsible} onChange={e => {
                  const newVisits = [...editedProject.serviceVisits];
                  newVisits[idx].responsible = e.target.value;
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }} placeholder="Ответственный" />
                <input type="number" value={visit.cost || ''} onChange={e => {
                  const newVisits = [...editedProject.serviceVisits];
                  newVisits[idx].cost = e.target.value ? Number(e.target.value) : undefined;
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }} placeholder="Стоимость" />
                <button className="remove-item" onClick={() => {
                  const newVisits = editedProject.serviceVisits.filter((_, i) => i !== idx);
                  setEditedProject(prev => ({ ...prev, serviceVisits: newVisits }));
                }}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
            <div className="add-item-form">
              <input type="date" value={newService.date} onChange={e => setNewService(prev => ({ ...prev, date: e.target.value }))} />
              <input type="text" value={newService.type} onChange={e => setNewService(prev => ({ ...prev, type: e.target.value }))} placeholder="Тип работ" />
              <select value={newService.status} onChange={e => setNewService(prev => ({ ...prev, status: e.target.value as any }))}>
                <option value="planned">Запланировано</option>
                <option value="completed">Выполнено</option>
                <option value="cancelled">Отменено</option>
              </select>
              <input type="text" value={newService.responsible} onChange={e => setNewService(prev => ({ ...prev, responsible: e.target.value }))} placeholder="Ответственный" />
              <input type="number" value={newService.cost} onChange={e => setNewService(prev => ({ ...prev, cost: Number(e.target.value) }))} placeholder="Стоимость" />
              <button className="btn-small" onClick={addService}>+ Добавить</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="detail-section">
          <h4>Дорожная карта (план/факт)</h4>
          <table className="roadmap-table">
            <thead>
              <tr>
                <th>Этап</th>
                <th>Плановая дата</th>
                <th>Фактическая дата</th>
              </tr>
            </thead>
            <tbody>
              {editedProject.roadmapPlanned.map((item, idx) => (
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
                      value={editedProject.roadmapActual[idx]?.date || ''}
                      onChange={e => {
                        const newActual = [...editedProject.roadmapActual];
                        newActual[idx] = { status: item.status, date: e.target.value };
                        setEditedProject(prev => ({ ...prev, roadmapActual: newActual }));
                      }}
                    />
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="detail-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Спецификации проекта</h3>
            <button className="btn-primary" onClick={handleCreateSpecForProject}>
              <i className="fas fa-plus"></i> Создать спецификацию
            </button>
          </div>
          {projectSpecs.length === 0 ? (
            <p>Нет привязанных спецификаций.</p>
          ) : (
            <div className="specs-list">
              {projectSpecs.map(spec => {
                const totalSum = getSpecTotalRub(spec.rows, usdRate, eurRate);
                const itemsCount = spec.rows.filter(r => r.type === 'data').length;
                return (
                  <div key={spec.id} className="spec-item" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '12px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{spec.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {itemsCount} поз. | Сумма: {Math.round(totalSum).toLocaleString()} ₽
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary btn-sm" onClick={() => handleOpenSpec(spec.id)} title="Открыть">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn-secondary btn-sm" onClick={() => handleDuplicateSpec(spec)} title="Дублировать">
                        <i className="fas fa-copy"></i>
                      </button>
                      <button className="btn-secondary btn-sm" onClick={() => handleUnlinkSpec(spec.id)} title="Открепить от проекта">
                        <i className="fas fa-unlink"></i>
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDeleteSpec(spec.id)} title="Удалить">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="detail-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};
