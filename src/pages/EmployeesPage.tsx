// src/pages/EmployeesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../App';
import './EmployeesPage.css';

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  base_salary: number;
  hire_date: string;
}

interface SalaryPayment {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
}

const typeLabels: Record<string, string> = {
  salary: 'Зарплата',
  bonus: 'Премия',
  vacation: 'Отпускные',
  sick_leave: 'Больничный',
};

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);

  // Поля формы
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formSalary, setFormSalary] = useState<number>(100000);
  const [formHireDate, setFormHireDate] = useState(new Date().toISOString().slice(0, 10));

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  }, [employees]);

  // Загрузка сотрудников
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

  // Загрузка выплат сотрудника
  const loadPayments = async (empId: string) => {
    const { data, error } = await supabase.from('salary_payments').select('*').eq('employee_id', empId).order('date', { ascending: false });
    if (!error && data) {
      setPayments(data);
    }
  };

  // Фильтрация
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === 'all' || emp.department === deptFilter;
      const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          emp.position.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [employees, deptFilter, search]);

  // Обработчики
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

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormName(emp.full_name);
    setFormPosition(emp.position);
    setFormDepartment(emp.department);
    setFormSalary(emp.base_salary);
    setFormHireDate(emp.hire_date);
    setShowAddModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;
    const { error } = await supabase.from('employees').update({
      full_name: formName,
      position: formPosition,
      department: formDepartment,
      base_salary: formSalary,
      hire_date: formHireDate,
    }).eq('id', selectedEmployee.id);
    if (!error) {
      setShowAddModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    } else {
      alert('Ошибка при сохранении');
    }
  };

  const openPayments = (emp: Employee) => {
    setSelectedEmployee(emp);
    loadPayments(emp.id);
    setShowPaymentsModal(true);
  };

  if (loading) {
    return <div className="employees-page"><div className="empty-state">Загрузка...</div></div>;
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
            <input
              type="text"
              placeholder="Поиск по ФИО или должности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 14px', borderRadius: '40px', border: '1px solid var(--border-light)', width: '220px', background: 'var(--bg-panel-solid)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedEmployee(null); setFormName(''); setFormPosition(''); setFormDepartment(''); setFormSalary(100000); setFormHireDate(new Date().toISOString().slice(0,10)); setShowAddModal(true); }}>
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
              <tr key={emp.id}>
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
                  <button className="btn-secondary" onClick={() => openPayments(emp)}><i className="fas fa-list"></i> Выплаты</button>
                  <button className="btn-secondary" onClick={() => handleEdit(emp)} style={{ marginLeft: 8 }}><i className="fas fa-edit"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно добавления/редактирования */}
      {showAddModal && (
        <div className="modal" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h3>
              <span className="modal-close" onClick={() => setShowAddModal(false)}>×</span>
            </div>
            <div className="setting"><label>ФИО</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="setting"><label>Должность</label><input type="text" value={formPosition} onChange={e => setFormPosition(e.target.value)} /></div>
            <div className="setting"><label>Отдел</label><input type="text" value={formDepartment} onChange={e => setFormDepartment(e.target.value)} /></div>
            <div className="setting"><label>Оклад (₽)</label><input type="number" value={formSalary} onChange={e => setFormSalary(Number(e.target.value))} /></div>
            <div className="setting"><label>Дата выхода</label><input type="date" value={formHireDate} onChange={e => setFormHireDate(e.target.value)} /></div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={selectedEmployee ? handleSaveEdit : handleAdd}>
              {selectedEmployee ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно выплат */}
      {showPaymentsModal && selectedEmployee && (
        <div className="modal" onClick={() => setShowPaymentsModal(false)}>
          <div className="modal-content payments-modal" style={{ maxHeight: '60vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Выплаты: {selectedEmployee.full_name}</h3>
              <span className="modal-close" onClick={() => setShowPaymentsModal(false)}>×</span>
            </div>
            <table className="employees-table">
              <thead><tr><th>Дата</th><th>Тип</th><th>Сумма</th><th>Описание</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.date).toLocaleDateString('ru-RU')}</td>
                    <td>{typeLabels[p.type] || p.type}</td>
                    <td>{p.amount.toLocaleString()} ₽</td>
                    <td>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
