// src/components/employees/VacationsTab.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { withAuthRetry } from '../../utils/supabaseHelpers';

interface Vacation {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface VacationsTabProps {
  employeeId: string;
}

export const VacationsTab: React.FC<VacationsTabProps> = ({ employeeId }) => {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingDays, setRemainingDays] = useState(28);
  const userRole = useSelector((state: RootState) => state.auth.role);

  useEffect(() => {
    loadVacations();
  }, []);

  const loadVacations = async () => {
    try {
      const vacations = await withAuthRetry<Vacation[]>(() =>
        supabase
          .from('vacations')
          .select('*')
          .eq('employee_id', employeeId)
          .order('start_date', { ascending: false })
          .then(({ data, error }) => ({ data: data as Vacation[] | null, error }))
      );
      setVacations(vacations);
    } catch (err) {
      console.error('Ошибка загрузки отпусков:', err);
    }
  };

  const handlePlan = async () => {
    if (!startDate || !endDate) {
      setError('Выберите даты начала и окончания отпуска');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Дата начала не может быть позже даты окончания');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const conflicts = await withAuthRetry<any[]>(() =>
        supabase
          .from('vacations')
          .select('*, employees!inner(*)')
          .eq('employees.position', 'Инженер-проектировщик')
          .neq('employee_id', employeeId)
          .gte('start_date', startDate)
          .lte('end_date', endDate)
          .then(({ data, error }) => ({ data: data as any[] | null, error }))
      );

      if (conflicts.length > 0) {
        setError('В выбранный период уже есть инженеры в отпуске. Выберите другие даты.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('vacations')
        .insert({
          employee_id: employeeId,
          start_date: startDate,
          end_date: endDate,
          status: 'pending',
        });

      if (!insertError) {
        setStartDate('');
        setEndDate('');
        loadVacations();
      } else {
        setError('Ошибка при планировании отпуска');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vacationId: string) => {
    const { error } = await supabase
      .from('vacations')
      .update({ status: 'approved' })
      .eq('id', vacationId);
    if (!error) loadVacations();
  };

  const handleReject = async (vacationId: string) => {
    const { error } = await supabase
      .from('vacations')
      .update({ status: 'rejected' })
      .eq('id', vacationId);
    if (!error) loadVacations();
  };

  const handleDeleteVacation = async (vacationId: string) => {
    if (!confirm('Удалить запись об отпуске?')) return;
    const { error } = await supabase.from('vacations').delete().eq('id', vacationId);
    if (!error) loadVacations();
  };

  return (
    <div className="vacations-container">
      <div className="vacations-form">
        <h4>Запланировать отпуск</h4>
        <div className="remaining-days">Остаток дней отпуска: {remainingDays} дн.</div>
        <div className="date-range">
          <label>С</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>по</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="btn-primary" onClick={handlePlan} disabled={loading}>
          {loading ? 'Проверка...' : 'Запланировать'}
        </button>
      </div>

      <div className="vacations-list">
        <h4>Запланированные отпуска</h4>
        {vacations.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Нет запланированных отпусков</p>
        ) : (
          vacations.map(v => (
            <div key={v.id} className="vacation-item">
              <div className="vacation-dates">
                {new Date(v.start_date).toLocaleDateString('ru-RU')} – {new Date(v.end_date).toLocaleDateString('ru-RU')}
              </div>
              <div className="vacation-status">
                {v.status === 'approved' ? 'Одобрен' : v.status === 'rejected' ? 'Отклонён' : 'На рассмотрении'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {userRole === 'director' && v.status === 'pending' && (
                  <>
                    <button className="btn-secondary" onClick={() => handleApprove(v.id)}>Одобрить</button>
                    <button className="btn-secondary" onClick={() => handleReject(v.id)} style={{ color: 'var(--danger)' }}>Отклонить</button>
                  </>
                )}
                <button className="btn-secondary" onClick={() => handleDeleteVacation(v.id)} style={{ color: 'var(--danger)' }}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
