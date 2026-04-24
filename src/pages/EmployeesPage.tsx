// src/pages/EmployeesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../App';
import { EmployeeDetail } from '../components/employees/EmployeeDetail';
import './EmployeesPage.css';

// ... интерфейсы без изменений

export const EmployeesPage: React.FC = () => {
  // ... существующий стейт
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [vacationFilter, setVacationFilter] = useState<string>('all');
  // ...

  const loadEmployees = async () => {
    setLoading(true);
    const { data: empData, error: empError } = await supabase.from('employees').select('*').order('full_name');
    if (!empError && empData) {
      // Получаем текущие утверждённые отпуска
      const today = new Date().toISOString().slice(0, 10);
      const { data: vacData, error: vacError } = await supabase
        .from('vacations')
        .select('employee_id')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);
      
      if (!vacError && vacData) {
        const onVacationIds = new Set(vacData.map(v => v.employee_id));
        // Добавляем флаг onVacation к сотрудникам
        const merged = empData.map(emp => ({
          ...emp,
          onVacation: onVacationIds.has(emp.id),
        }));
        setEmployees(merged);
      } else {
        setEmployees(empData.map(emp => ({ ...emp, onVacation: false })));
      }
    }
    setLoading(false);
  };

  // ...

  // Фильтрация с учётом отпусков
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = deptFilter === 'all' || emp.department === deptFilter;
      const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          emp.position.toLowerCase().includes(search.toLowerCase());
      const matchVacation = vacationFilter === 'all' ||
        (vacationFilter === 'onVacation' && (emp as any).onVacation) ||
        (vacationFilter === 'available' && !(emp as any).onVacation);
      return matchDept && matchSearch && matchVacation;
    });
  }, [employees, deptFilter, search, vacationFilter]);

  // ... остальной код без изменений
};
