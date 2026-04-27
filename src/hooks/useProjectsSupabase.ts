// src/hooks/useProjectsSupabase.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../App';
import { setProjects, Project } from '../store/projectsSlice';

export const useProjectsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('projects').select('*');
      if (role !== 'director' && role !== 'pm') {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      const projects = (data || []).map((item: any) => ({
        id: item.id,
        shortId: item.short_id,
        name: item.name,
        category: item.category,
        status: item.status,
        statusStartDate: item.status_start_date,
        startDate: item.start_date,
        endDate: item.end_date,
        progress: item.progress,
        contractAmount: item.contract_amount,
        engineer: item.engineer,
        projectManager: item.project_manager,
        priority: item.priority,
        meetings: item.meetings,
        purchases: item.purchases,
        incomeSchedule: item.income_schedule,
        expenseSchedule: item.expense_schedule,
        serviceVisits: item.service_visits,
        actualIncome: item.actual_income,
        actualExpenses: item.actual_expenses,
        nextStatus: item.next_status,
        nextStatusDate: item.next_status_date,
        roadmapPlanned: item.roadmap_planned,
        roadmapActual: item.roadmap_actual,
      }));
      dispatch(setProjects(projects));
    } catch (err: any) {
      console.error('loadProjects error:', err);
      // не блокируем интерфейс
    }
  }, [user, role, dispatch]);

  const addProjectToDb = useCallback(async (project: Omit<Project, 'id' | 'shortId'>) => {
    if (!user) return;
    const newId = Date.now().toString();
    const shortId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const dbProject = { /* тот же маппинг, что и раньше */ };
    await supabase.from('projects').insert(dbProject);
    await loadProjects();
    return newId;
  }, [user, loadProjects]);

  // updateProjectInDb, deleteProjectFromDb – оставьте как было
  // ...

  return { loadProjects, addProjectToDb, /* и т.д. */ };
};
