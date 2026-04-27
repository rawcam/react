// src/pages/WorkReportsPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../App';
import { RootState } from '../store';
import './WorkReportsPage.css';

interface WorkReport {
  id: string;
  date: string;
  project_id: string | null;
  project_name: string;
  hours: number;
  cost: number;
  description: string;
}

const HOURLY_RATE = 2500;

export const WorkReportsPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const projects = useSelector((state: RootState) => state.projects.list);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formHours, setFormHours] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterProject, setFilterProject] = useState('all');

  const loadReports = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('work_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Ошибка загрузки отчётов:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const totalCost = useMemo(() => reports.reduce((sum, r) => sum + r.cost, 0), [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchDate = filterDate ? r.date === filterDate : true;
      const matchProject = filterProject === 'all' ||
        (filterProject === 'office' && !r.project_id) ||
        r.project_id === filterProject;
      return matchDate && matchProject;
    });
  }, [reports, filterDate, filterProject]);

  const resetForm = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormProjectId('');
    setFormHours(0);
    setFormDescription('');
    setEditingId(null);
  };

  const handleOpenModal = (report?: WorkReport) => {
    if (report) {
      setEditingId(report.id);
      setFormDate(report.date);
      setFormProjectId(report.project_id || '');
      setFormHours(report.hours);
      setFormDescription(report.description);
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => { setModalOpen(false); resetForm(); };

  const handleSave = async () => {
    if (!user || !formDate) return;
    const projectName = formProjectId
      ? projects.find(p => p.id === formProjectId)?.name || ''
      : 'Общие затраты на офис';
    const cost = formHours * HOURLY_RATE;

    const payload = {
      user_id: user.id,
      date: formDate,
      project_id: formProjectId || null,
      project_name: projectName,
      hours: formHours,
      cost,
      description: formDescription,
    };

    if (editingId) {
      await supabase.from('work_reports').update(payload).eq('id', editingId);
    } else {
      await supabase.from('work_reports').insert(payload);
    }
    handleCloseModal();
    await loadReports();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await supabase.from('work_reports').delete().eq('id', id);
    await loadReports();
  };

  if (loading) return <div className="page-message">Загрузка...</div>;

  return (
    <div className="work-reports-page">
      <div className="page-header">
        <h2>Отчёты о рабочем времени</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <i className="fas fa-plus"></i> Новая запись
        </button>
      </div>

      <div className="informers-row">
        <div className="informer" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="label">Ожидаемая зарплата</div>
          <div className="value">{totalCost.toLocaleString()} ₽</div>
          <div className="sub">ставка {HOURLY_RATE} ₽/ч</div>
        </div>
      </div>

      <div className="reports-toolbar">
        <div className="filter-group">
          <label>Дата</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Проект</label>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="all">Все</option>
            <option value="office">Общие затраты на офис</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Проект</th>
              <th>Часы</th>
              <th>Стоимость</th>
              <th>Описание</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr><td colSpan={6} className="empty-cell">Нет записей</td></tr>
            ) : (
              filteredReports.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString('ru-RU')}</td>
                  <td>{r.project_name}</td>
                  <td>{r.hours} ч</td>
                  <td>{r.cost.toLocaleString()} ₽</td>
                  <td>{r.description}</td>
                  <td className="actions">
                    <button onClick={() => handleOpenModal(r)} title="Редактировать">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(r.id)} title="Удалить">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Редактировать запись' : 'Новая запись'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="form-group">
              <label>Дата</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Проект</label>
              <select value={formProjectId} onChange={e => setFormProjectId(e.target.value)}>
                <option value="">Общие затраты на офис</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Часы</label>
              <input type="number" step="0.5" min="0" value={formHours} onChange={e => setFormHours(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Стоимость (авто)</label>
              <input type="text" value={`${(formHours * HOURLY_RATE).toLocaleString()} ₽`} readOnly />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea rows={3} value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCloseModal}>Отмена</button>
              <button className="btn-primary" onClick={handleSave}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
