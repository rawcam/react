// src/components/employees/VacationsTab.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';

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
  const [remainingDays, setRemainingDays] = useState(28); // заглушка, позже можно считать

  useEffect(() => {
    loadVacations();
  }, []);

  const loadVacations = async () => {
    const { data, error } = await supabase
      .from('vacations')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });
    if (!error && data) {
      setVacations(data);
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

    // Проверяем, нет ли пересечения с другими инженерами (упрощённо: считаем, что инженеры – все, кроме менеджеров)
    const { data: conflicts, error: conflictError } = await supabase
      .from('vacations')
      .select('*, employees!inner(*)')
      .eq('employees.position', 'Инженер-проектировщик')
      .gte('start_date', startDate)
      .lte('end_date', endDate);

    if (!conflictError && conflicts && conflicts.length > 0) {
      setError('В выбранный период уже есть инженеры в отпуске. Выберите другие даты.');
      setLoading(false);
      return;
    }

    // Создаём отпуск
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
    setLoading(false);
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
              <div className="vacation-dates">{new Date(v.start_date).toLocaleDateString('ru-RU')} – {new Date(v.end_date).toLocaleDateString('ru-RU')}</div>
              <div className="vacation-status">{v.status === 'approved' ? 'Одобрен' : v.status === 'rejected' ? 'Отклонён' : 'На рассмотрении'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
