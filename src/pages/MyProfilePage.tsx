// src/pages/MyProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../App';
import { RootState } from '../store';
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

export const MyProfilePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user) return;
    const loadEmployee = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', user.email)
        .single();
      if (!error && data) {
        setEmployee(data);
        setPredictedBonus(Math.round(data.base_salary * 0.15));

        // Ближайший утверждённый отпуск
        const today = new Date().toISOString().slice(0, 10);
        const { data: vacations } = await supabase
          .from('vacations')
          .select('start_date')
          .eq('employee_id', data.id)
          .eq('status', 'approved')
          .gte('start_date', today)
          .order('start_date', { ascending: true })
          .limit(1);
        if (vacations && vacations.length > 0) {
          const start = new Date(vacations[0].start_date);
          const diff = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          setDaysUntilVacation(diff > 0 ? diff : 0);
        }
      }
      setLoading(false);
    };
    loadEmployee();
  }, [user]);

  if (loading) return <div className="profile-page"><div className="empty-state">Загрузка...</div></div>;
  if (!employee) return <div className="profile-page"><div className="empty-state">Профиль не найден. Обратитесь к администратору.</div></div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-greeting">
          <h2>Привет, {employee.full_name.split(' ')[1]}! 👋</h2>
          <p className="positive-quote">«Самая трудная часть работы — решиться начать. Остальное — просто упорство и правильные инструменты.»</p>
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

      <div className="profile-actions">
        <button className="btn-primary" onClick={() => alert('Функция запроса расчётного листа пока недоступна')}>
          📄 Запросить расчётный лист
        </button>
        <button className="btn-secondary" onClick={() => alert('Планирование отпуска откроется в новом окне')}>
          🏖️ Запланировать отпуск
        </button>
      </div>
    </div>
  );
};
