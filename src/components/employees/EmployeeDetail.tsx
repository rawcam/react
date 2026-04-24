// src/components/employees/EmployeeDetail.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';
import { VacationsTab } from './VacationsTab';
import './EmployeeDetail.css';

// ... (интерфейсы Employee и SalaryPayment без изменений)

interface EmployeeDetailProps {
  employee: Employee;
  onBack: () => void;
  onUpdate: () => void;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'vacations' | 'documents'>('info');
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('salary_payments')
      .select('*')
      .eq('employee_id', employee.id)
      .order('date', { ascending: false });
    if (!error && data) {
      setPayments(data);
    }
  };

  const handleChange = (field: keyof Employee, value: any) => {
    setEditedEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('employees')
      .update({
        full_name: editedEmployee.full_name,
        position: editedEmployee.position,
        department: editedEmployee.department,
        base_salary: editedEmployee.base_salary,
        hire_date: editedEmployee.hire_date,
      })
      .eq('id', employee.id);
    if (!error) {
      onUpdate();
      alert('Сохранено');
    } else {
      alert('Ошибка при сохранении');
    }
    setSaving(false);
  };

  return (
    <div className="employee-detail">
      <button className="btn-secondary" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Назад к списку
      </button>
      <h2 style={{ marginTop: 16 }}>{employee.full_name}</h2>

      <div className="detail-tabs">
        <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>Информация</button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>Выплаты</button>
        <button className={activeTab === 'vacations' ? 'active' : ''} onClick={() => setActiveTab('vacations')}>Отпуска</button>
        <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>Документы</button>
      </div>

      {activeTab === 'info' && (
        <div className="detail-form">
          <div className="detail-field"><label>ФИО</label><input type="text" value={editedEmployee.full_name} onChange={e => handleChange('full_name', e.target.value)} /></div>
          <div className="detail-field"><label>Должность</label><input type="text" value={editedEmployee.position} onChange={e => handleChange('position', e.target.value)} /></div>
          <div className="detail-field"><label>Отдел</label><input type="text" value={editedEmployee.department} onChange={e => handleChange('department', e.target.value)} /></div>
          <div className="detail-field"><label>Оклад (₽)</label><input type="number" value={editedEmployee.base_salary} onChange={e => handleChange('base_salary', Number(e.target.value))} /></div>
          <div className="detail-field"><label>Дата выхода</label><input type="date" value={editedEmployee.hire_date} onChange={e => handleChange('hire_date', e.target.value)} /></div>
          <div className="detail-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="payments-list">
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
      )}

      {activeTab === 'vacations' && <VacationsTab employeeId={employee.id} />}

      {activeTab === 'documents' && (
        <div className="placeholder-tab">
          <p>Загрузка должностных инструкций и других документов (будет доступно позже)</p>
        </div>
      )}
    </div>
  );
};
