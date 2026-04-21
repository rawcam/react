// src/hooks/useSpecificationsSupabase.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabaseClient';
import { setSpecifications, Specification } from '../store/specificationsSlice';

export const useSpecificationsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);

  const loadSpecifications = useCallback(async (): Promise<void> => {
    if (!user) return;
    try {
      let query = supabase.from('specifications').select('*');
      // Если роль не director и не pm, фильтруем по user_id
      if (role !== 'director' && role !== 'pm') {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) {
        console.error('loadSpecifications error:', error.message);
        return;
      }
      const specs = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        projectId: item.project_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        rows: item.rows || [],
      }));
      dispatch(setSpecifications(specs));
    } catch (err) {
      console.error('loadSpecifications unexpected error:', err);
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
      throw error;
    }
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
      throw error;
    }
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
      throw error;
    }
    await loadSpecifications();
  }, [user, loadSpecifications]);

  return {
    loadSpecifications,
    addSpecificationToDb,
    updateSpecificationInDb,
    deleteSpecificationFromDb,
  };
};
