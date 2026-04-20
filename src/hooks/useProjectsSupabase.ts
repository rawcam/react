// src/hooks/useProjectsSupabase.ts
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabaseClient';
import { setProjects } from '../store/projectsSlice';

export const useProjectsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const loadProjects = async () => {
    if (!user) {
      console.warn('[Projects] No user, skipping load');
      return;
    }
    console.log('[Projects] Loading for user:', user.id);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Projects] Load error:', error.message, error.details, error.hint);
      return;
    }
    console.log('[Projects] Loaded', data?.length, 'projects');
    const projects = data.map((item: any) => ({
      id: item.id,
      shortId: item.short_id,
      name: item.name,
      category: item.category,
      status: item.status,
      statusStartDate: item.status_start_date,
      startDate: item.start_date,
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
  };

  // ... остальные функции addProjectToDb, updateProjectInDb, deleteProjectFromDb без изменений ...
};
