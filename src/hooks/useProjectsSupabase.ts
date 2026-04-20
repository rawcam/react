// src/hooks/useProjectsSupabase.ts
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabaseClient';
import { setProjects, Project } from '../store/projectsSlice';

export const useProjectsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const loadProjects = async () => {
    console.log('[useProjectsSupabase] loadProjects called, user:', user?.id);
    if (!user) {
      console.warn('[useProjectsSupabase] No user, skipping load');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[useProjectsSupabase] Load error:', error.message, error.details, error.hint);
        // Важно: всё равно ставим пустой массив, чтобы интерфейс не висел
        dispatch(setProjects([]));
        return;
      }
      
      console.log('[useProjectsSupabase] Loaded', data?.length, 'projects');
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
    } catch (err) {
      console.error('[useProjectsSupabase] Unexpected error:', err);
      dispatch(setProjects([]));
    }
  };

  // ... остальные функции (addProjectToDb, updateProjectInDb, deleteProjectFromDb) без изменений ...
  // (возьмите их из предыдущей версии, они уже рабочие)
};

  const addProjectToDb = async (project: Omit<Project, 'id' | 'shortId'>) => {
    console.log('[useProjectsSupabase] addProjectToDb called');
    if (!user) return;
    const newId = Date.now().toString();
    const shortId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const dbProject = {
      id: newId,
      short_id: shortId,
      name: project.name,
      category: project.category,
      status: project.status,
      status_start_date: project.statusStartDate,
      start_date: project.startDate,
      progress: project.progress,
      contract_amount: project.contractAmount,
      engineer: project.engineer,
      project_manager: project.projectManager,
      priority: project.priority,
      meetings: project.meetings,
      purchases: project.purchases,
      income_schedule: project.incomeSchedule,
      expense_schedule: project.expenseSchedule,
      service_visits: project.serviceVisits,
      actual_income: project.actualIncome,
      actual_expenses: project.actualExpenses,
      next_status: project.nextStatus,
      next_status_date: project.nextStatusDate,
      roadmap_planned: project.roadmapPlanned,
      roadmap_actual: project.roadmapActual,
      user_id: user.id,
    };
    const { error } = await supabase.from('projects').insert(dbProject);
    if (error) {
      console.error('[useProjectsSupabase] Add error:', error);
      return;
    }
    await loadProjects();
    return newId;
  };

  const updateProjectInDb = async (id: string, updates: Partial<Project>) => {
    console.log('[useProjectsSupabase] updateProjectInDb called for id:', id);
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.statusStartDate !== undefined) dbUpdates.status_start_date = updates.statusStartDate;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.contractAmount !== undefined) dbUpdates.contract_amount = updates.contractAmount;
    if (updates.engineer !== undefined) dbUpdates.engineer = updates.engineer;
    if (updates.projectManager !== undefined) dbUpdates.project_manager = updates.projectManager;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.meetings !== undefined) dbUpdates.meetings = updates.meetings;
    if (updates.purchases !== undefined) dbUpdates.purchases = updates.purchases;
    if (updates.incomeSchedule !== undefined) dbUpdates.income_schedule = updates.incomeSchedule;
    if (updates.expenseSchedule !== undefined) dbUpdates.expense_schedule = updates.expenseSchedule;
    if (updates.serviceVisits !== undefined) dbUpdates.service_visits = updates.serviceVisits;
    if (updates.actualIncome !== undefined) dbUpdates.actual_income = updates.actualIncome;
    if (updates.actualExpenses !== undefined) dbUpdates.actual_expenses = updates.actualExpenses;
    if (updates.nextStatus !== undefined) dbUpdates.next_status = updates.nextStatus;
    if (updates.nextStatusDate !== undefined) dbUpdates.next_status_date = updates.nextStatusDate;
    if (updates.roadmapPlanned !== undefined) dbUpdates.roadmap_planned = updates.roadmapPlanned;
    if (updates.roadmapActual !== undefined) dbUpdates.roadmap_actual = updates.roadmapActual;

    const { error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[useProjectsSupabase] Update error:', error);
      return;
    }
    await loadProjects();
  };

  const deleteProjectFromDb = async (id: string) => {
    console.log('[useProjectsSupabase] deleteProjectFromDb called for id:', id);
    if (!user) return;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('[useProjectsSupabase] Delete error:', error);
      return;
    }
    await loadProjects();
  };

  return {
    loadProjects,
    addProjectToDb,
    updateProjectInDb,
    deleteProjectFromDb,
  };
};
