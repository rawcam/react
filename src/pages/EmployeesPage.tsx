// src/pages/EmployeesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../App';
import { EmployeeDetail } from '../components/employees/EmployeeDetail';
import './EmployeesPage.css';

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  base_salary: number;
  hire_date: string;
}

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [vacationFilter, setVacationFilter] = useState<string>('all'); // all, onVacation, available
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formSalary, setFormSalary] = useState<number>(100000);
  const [formHireDate, setFormHireDate] = useState(new Date().toISOString().slice(0, 10));

  // Определяем, нужно ли показать детальную карточку
  const searchParams = new URLSearchParams(location.search);
  const employeeId = searchParams.get('id');
  const selectedEmployee = employeeId ? employees.find(e => e.id === employeeId) || null : null;

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  }, [employees]);

  const loadEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('employees').select('*').order('full_name');
    if (!error && data) {
      setEmployees(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Здесь нужно будет загружать статус отпусков, пока заглушка
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === 'all' || emp.department === deptFilter;
      const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          emp.position.toLowerCase().includes(search.toLowerCase());
      // Фильтр по отпускам пока пропускаем всех
      return matchDept && matchSearch;
    });
  }, [employees, deptFilter, search]);

  const handleAdd = async () => {
    const { error } = await supabase.from('employees').insert({
      full_name: formName,
      position: formPosition,
      department: formDepartment,
      base_salary: formSalary,
      hire_date: formHireDate,
    });
    if (!error) {
      setShowAddModal(false);
      setFormName(''); setFormPosition(''); setFormDepartment(''); setFormSalary(100000);
      loadEmployees();
    } else {
      alert('Ошибка при добавлении');
    }
  };

  const handleRowClick = (empId: string) => {
    navigate(`/employees?id=${empId}`, { replace: true });
  };

  const handleBack = () => {
    navigate('/employees', { replace: true });
  };

  if (loading) {
    return <div className="employees-page"><div className="empty-state">Загрузка...</div></div>;
  }

  // Если выбран сотрудник — показываем детальную карточку
  if (selectedEmployee) {
    return <EmployeeDetail employee={selectedEmployee} onBack={handleBack} onUpdate={loadEmployees} />;
  }

  return (
    <div className="employees-page">
      {/* Тулбар */}
      <div className="employees-toolbar">
        <div className="toolbar-left">
          <div className="filter-group">
            <label>Отдел</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="all">Все отделы</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Отпуск</label>
            <select value={vacationFilter} onChange={e => setVacationFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="onVacation">В отпуске</option>
              <option value="available">Доступен</option>
            </select>
          </div>
          <div className="filter-group">
            <input
              type="text"
              placeholder="Поиск по ФИО или должности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 14px', borderRadius: '40px', border: '1px solid var(--border-light)', width: '220px', background: 'var(--bg-panel-solid)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setFormName(''); setFormPosition(''); setFormDepartment(''); setFormSalary(100000); setFormHireDate(new Date().toISOString().slice(0,10)); setShowAddModal(true); }}>
          <i className="fas fa-user-plus"></i> Добавить
        </button>
      </div>

      {/* Таблица */}
      <div className="employees-card">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Должность</th>
              <th>Отдел</th>
              <th>Оклад</th>
              <th>Дата выхода</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} onClick={() => handleRowClick(emp.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="employee-name">
                    <span className="employee-avatar">{emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    {emp.full_name}
                  </div>
                </td>
                <td>{emp.position}</td>
                <td>{emp.department}</td>
                <td>{emp.base_salary.toLocaleString()} ₽</td>
                <td>{new Date(emp.hire_date).toLocaleDateString('ru-RU')}</td>
                <td>
                  <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); handleRowClick(emp.id); }}>Подробнее</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно добавления */}
      {showAddModal && (
        <div className="modal" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Новый сотрудник</h3><span className="modal-close" onClick={() => setShowAddModal(false)}>×</span></div>
            <div className="setting"><label>ФИО</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="setting"><label>Должность</label><input type="text" value={formPosition} onChange={e => setFormPosition(e.target.value)} /></div>
            <div className="setting"><label>Отдел</label><input type="text" value={formDepartment} onChange={e => setFormDepartment(e.target.value)} /></div>
            <div className="setting"><label>Оклад (₽)</label><input type="number" value={formSalary} onChange={e => setFormSalary(Number(e.target.value))} /></div>
            <div className="setting"><label>Дата выхода</label><input type="date" value={formHireDate} onChange={e => setFormHireDate(e.target.value)} /></div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleAdd}>Добавить</button>
          </div>
        </div>
      )}
    </div>
  );
};
