// src/hooks/useSpecificationsSupabase.ts
import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../App';
import { setSpecifications, Specification } from '../store/specificationsSlice';

let cachedSpecs: Specification[] | null = null;

export const useSpecificationsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);
  const abortRef = useRef<AbortController | null>(null);

  const loadSpecifications = useCallback(async () => {
    if (!user) return;

    // Показываем кеш сразу
    if (cachedSpecs) {
      dispatch(setSpecifications(cachedSpecs));
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const timer = setTimeout(() => controller.abort(), 10_000);

      let query = supabase.from('specifications').select('*').abortSignal(controller.signal);
      if (role !== 'director' && role !== 'pm') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      clearTimeout(timer);

      if (error) throw error;

      const specs: Specification[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        projectId: item.project_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        rows: item.rows || [],
      }));

      cachedSpecs = specs;
      dispatch(setSpecifications(specs));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Запрос спецификаций прерван по таймауту');
      } else {
        console.error('loadSpecifications error:', err);
      }
    }
  }, [user, role, dispatch]);

  const addSpecificationToDb = useCallback(async (spec: Omit<Specification, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const newId = Date.now().toString();
    const now = new Date().toISOString();
    const newSpec = {
      id: newId,
      name: spec.name,
      project_id: spec.projectId,
      rows: spec.rows || [],
      user_id: user.id,
      created_at: now,
      updated_at: now,
    };
    const { error } = await supabase.from('specifications').insert(newSpec);
    if (error) {
      console.error('addSpecificationToDb error:', error.message);
      return;
    }
    cachedSpecs = null;
    await loadSpecifications();
    return newId;
  }, [user, loadSpecifications]);

  const updateSpecificationInDb = useCallback(async (id: string, updates: Partial<Specification>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.rows !== undefined) dbUpdates.rows = updates.rows;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('specifications')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('updateSpecificationInDb error:', error.message);
      return;
    }
    cachedSpecs = null;
    await loadSpecifications();
  }, [user, loadSpecifications]);

  const deleteSpecificationFromDb = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('specifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('deleteSpecificationFromDb error:', error.message);
      return;
    }
    cachedSpecs = null;
    await loadSpecifications();
  }, [user, loadSpecifications]);

  return {
    loadSpecifications,
    addSpecificationToDb,
    updateSpecificationInDb,
    deleteSpecificationFromDb,
  };
};
