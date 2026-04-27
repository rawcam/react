// src/pages/MyProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { RootState } from '../store';
import { withAuthRetry } from '../utils/supabaseHelpers';
import './MyProfilePage.css';

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  base_salary: number;
  hire_date: string;
  email: string;
}

interface Vacation {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const inspiringQuotes = [
  '«Самая трудная часть работы — решиться начать. Остальное — просто упорство и правильные инструменты.»',
  '«Успех — это сумма маленьких усилий, повторяемых изо дня в день.»',
  '«Великие дела не совершаются в одиночку, но начинаются с одного человека.»',
  '«Каждый день — это новая возможность стать лучше, чем вчера.»',
  '«Твой вклад важен. Без тебя эта команда была бы другой.»'
];

export const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vacationError, setVacationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [nextSalaryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 5);
    return d.toLocaleDateString('ru-RU');
  });
  const [advanceDate] = useState(() => {
    const d = new Date();
    d.setDate(20);
    return d.toLocaleDateString('ru-RU');
  });
  const [predictedBonus, setPredictedBonus] = useState(0);
  const [daysUntilVacation, setDaysUntilVacation] = useState(0);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)]);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadEmployee = async () => {
      try {
        const emp = await withAuthRetry<Employee>(async () => {
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', user.email)
            .single();
          return { data: data as Employee | null, error };
        });
        if (emp) {
          setEmployee(emp);
          setPredictedBonus(Math.round(emp.base_salary * 0.15));

          const today = new Date().toISOString().slice(0, 10);
          const vacations = await withAuthRetry<Vacation[]>(async () => {
            const { data, error } = await supabase
              .from('vacations')
              .select('*')
              .eq('employee_id', emp.id)
              .eq('status', 'approved')
              .gte('start_date', today)
              .order('start_date', { ascending: true })
              .limit(1);
            return { data: data as Vacation[] | null, error };
          });
          if (vacations && vacations.length > 0) {
            const start = new Date(vacations[0].start_date);
            const diff = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            setDaysUntilVacation(diff > 0 ? diff : 0);
          }
        }
      } catch (err: any) {
        console.error('MyProfilePage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [user]);

  const handlePlanVacation = async () => {
    if (!startDate || !endDate) {
      setVacationError('Выберите даты начала и окончания отпуска');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setVacationError('Дата начала не может быть позже даты окончания');
      return;
    }
    if (!employee) return;

    setSubmitting(true);
    setVacationError('');

    try {
      const conflicts = await withAuthRetry<any[]>(async () => {
        const { data, error } = await supabase
          .from('vacations')
          .select('*, employees!inner(*)')
          .eq('employees.position', 'Инженер-проектировщик')
          .neq('employee_id', employee.id)
          .gte('start_date', startDate)
          .lte('end_date', endDate);
        return { data: data as any[] | null, error };
      });

      if (conflicts.length > 0) {
        setVacationError('В выбранный период уже есть инженеры в отпуске. Выберите другие даты.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('vacations')
        .insert({
          employee_id: employee.id,
          start_date: startDate,
          end_date: endDate,
          status: 'pending',
        });

      if (!insertError) {
        setShowVacationModal(false);
        setStartDate('');
        setEndDate('');
        alert('Заявление на отпуск отправлено на рассмотрение.');
      } else {
        setVacationError('Ошибка при отправке заявления.');
      }
    } catch (err) {
      setVacationError('Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="profile-page"><div className="empty-state">Загрузка...</div></div>;
  if (!employee) return <div className="profile-page"><div className="empty-state">Профиль не найден. Обратитесь к администратору.</div></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-greeting">
          <h2>Привет, {employee.full_name.split(' ')[1]}! 👋</h2>
          <p className="positive-quote">{quote}</p>
        </div>
        <div className="profile-avatar">
          {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="informers-row">
        <div className="informer positive salary">
          <div className="label">Следующая зарплата</div>
          <div className="value">{employee.base_salary.toLocaleString()} ₽</div>
          <div className="date">{nextSalaryDate}</div>
        </div>
        <div className="informer positive advance">
          <div className="label">Аванс</div>
          <div className="value">{(employee.base_salary * 0.4).toLocaleString()} ₽</div>
          <div className="date">{advanceDate}</div>
        </div>
        <div className="informer positive bonus">
          <div className="label">Ожидаемая премия</div>
          <div className="value">{predictedBonus.toLocaleString()} ₽</div>
          <div className="date">по итогам месяца</div>
        </div>
        <div className="informer positive vacation">
          <div className="label">До отпуска</div>
          <div className="value">{daysUntilVacation > 0 ? `${daysUntilVacation} дн.` : 'Нет данных'}</div>
          <div className="date">ближайший запланированный</div>
        </div>
      </div>

      <div className="profile-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => alert('Функция запроса расчётного листа пока недоступна')}>
          📄 Запросить расчётный лист
        </button>
        <button className="btn-secondary" onClick={() => setShowVacationModal(true)}>
          🏖️ Запланировать отпуск
        </button>
        <button className="btn-secondary" onClick={() => navigate('/work-reports')}>
          📊 Отчёты
        </button>
      </div>

      {showVacationModal && (
        <div className="modal" onClick={() => setShowVacationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Запланировать отпуск</h3>
              <span className="modal-close" onClick={() => setShowVacationModal(false)}>×</span>
            </div>
            <div className="date-range" style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
              <label>С</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <label>по</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            {vacationError && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '12px' }}>{vacationError}</div>}
            <button className="btn-primary" onClick={handlePlanVacation} disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Отправка...' : 'Отправить заявление'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
