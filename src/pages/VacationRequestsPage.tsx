// src/pages/VacationRequestsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../App';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { withAuthRetry } from '../utils/supabaseHelpers';
import './VacationRequestsPage.css';

interface VacationRequest {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const VacationRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const userRole = useSelector((state: RootState) => state.auth.role);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await withAuthRetry<any[]>(() =>
        supabase
          .from('vacations')
          .select('id, employee_id, start_date, end_date, status, created_at, employees(full_name, department)')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => ({ data: data as any[], error }))
      );

      const formatted: VacationRequest[] = data.map((item: any) => ({
        id: item.id,
        employee_id: item.employee_id,
        full_name: item.employees?.full_name || 'Неизвестный',
        department: item.employees?.department || '—',
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status,
        created_at: item.created_at,
      }));
      setRequests(formatted);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        await supabase.auth.signOut();
        window.location.reload();
      } else {
        setError(err.message);
        console.error('Load requests error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchDept = deptFilter === 'all' || req.department === deptFilter;
      return matchStatus && matchDept;
    });
  }, [requests, statusFilter, deptFilter]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('vacations')
      .update({ status: action })
      .eq('id', id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    } else {
      alert('Ошибка при обновлении статуса');
    }
  };

  const departments = useMemo(() => {
    const depts = new Set(requests.map(r => r.department));
    return Array.from(depts);
  }, [requests]);

  if (loading) return <div className="requests-page"><div className="empty-state">Загрузка заявок...</div></div>;

  if (error) {
    return (
      <div className="requests-page">
        <div className="empty-state">
          <p>Ошибка: {error}</p>
          <button onClick={loadRequests}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-page">
      <div className="requests-toolbar">
        <div className="toolbar-left">
          <div className="filter-group">
            <label>Статус</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="pending">На рассмотрении</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклонённые</option>
              <option value="all">Все</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Отдел</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="all">Все отделы</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="requests-card">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Отдел</th>
              <th>Даты</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Нет заявок</td></tr>
            ) : (
              filteredRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.full_name}</td>
                  <td>{req.department}</td>
                  <td>{new Date(req.start_date).toLocaleDateString('ru-RU')} – {new Date(req.end_date).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <span className={`status-badge ${req.status}`}>
                      {req.status === 'pending' ? 'На рассмотрении' : req.status === 'approved' ? 'Одобрен' : 'Отклонён'}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' && (userRole === 'director' || userRole === 'pm') && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-approve" onClick={() => handleAction(req.id, 'approved')}>Одобрить</button>
                        <button className="btn-secondary btn-reject" onClick={() => handleAction(req.id, 'rejected')}>Отклонить</button>
                      </div>
                    )}
                    {req.status !== 'pending' && <span style={{ color: 'var(--text-muted)' }}>Нет действий</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
