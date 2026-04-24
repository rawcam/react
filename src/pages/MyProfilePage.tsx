// src/pages/MyProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../App';
import './MyProfilePage.css';

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  base_salary: number;
}

export const MyProfilePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Связываем auth.user.email с employees (предположим, что email совпадает)
    supabase
      .from('employees')
      .select('*')
      .eq('email', user.email) // нужно добавить поле email в таблицу employees
      .single()
      .then(({ data, error }) => {
        if (!error && data) setEmployee(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="profile-page"><div className="empty-state">Загрузка...</div></div>;
  if (!employee) return <div className="profile-page"><div className="empty-state">Профиль не найден</div></div>;

  // Имитация данных для информеров (потом заменим на реальные)
  const nextSalaryDate = new Date(2026, 4, 5).toLocaleDateString('ru-RU'); // 5 мая 2026
  const advanceDate = new Date(2026, 3, 20).toLocaleDateString('ru-RU');
  const predictedBonus = Math.round(employee.base_salary * 0.15);
  const daysUntilVacation = 12;

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
        <div className="informer positive">
          <div className="label">Следующая зарплата</div>
          <div className="value">{employee.base_salary.toLocaleString()} ₽</div>
          <div className="date">{nextSalaryDate}</div>
        </div>
        <div className="informer positive">
          <div className="label">Аванс</div>
          <div className="value">{(employee.base_salary * 0.4).toLocaleString()} ₽</div>
          <div className="date">{advanceDate}</div>
        </div>
        <div className="informer positive">
          <div className="label">Ожидаемая премия</div>
          <div className="value">{predictedBonus.toLocaleString()} ₽</div>
          <div className="date">по итогам месяца</div>
        </div>
        <div className="informer positive">
          <div className="label">До отпуска</div>
          <div className="value">{daysUntilVacation} дн.</div>
          <div className="date">ближайший запланированный</div>
        </div>
      </div>

      {/* Здесь можно добавить планирование отпуска, историю выплат и т.д. */}
      <div className="profile-actions">
        <button className="btn-primary" onClick={() => alert('Функция запроса расчётного листа пока недоступна')}>
          📄 Запросить расчётный лист
        </button>
      </div>
    </div>
  );
};
