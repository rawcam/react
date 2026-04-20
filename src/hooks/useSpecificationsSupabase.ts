// src/hooks/useSpecificationsSupabase.ts
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabaseClient';
import { setSpecifications, Specification } from '../store/specificationsSlice';

export const useSpecificationsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const loadSpecifications = async () => {
    console.log('[useSpecificationsSupabase] loadSpecifications called, user:', user?.id);
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .eq('user_id', user.id);
      if (error) {
        console.error('[useSpecificationsSupabase] Load error:', error.message);
        return;
      }
      console.log('[useSpecificationsSupabase] Loaded', data?.length, 'specifications');
      const specs = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        projectId: item.project_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        rows: item.rows || [],
      }));
      dispatch(setSpecifications(specs));
    } catch (err: any) {
      console.error('[useSpecificationsSupabase] Unexpected error:', err);
    }
  };

  const addSpecificationToDb = async (spec: Omit<Specification, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('[useSpecificationsSupabase] addSpecificationToDb called');
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
    try {
      const { error } = await supabase.from('specifications').insert(newSpec);
      if (error) {
        console.error('[useSpecificationsSupabase] Add error:', error.message);
        return;
      }
      await loadSpecifications();
      return newId;
    } catch (err: any) {
      console.error('[useSpecificationsSupabase] Add unexpected error:', err);
    }
  };

  const updateSpecificationInDb = async (id: string, updates: Partial<Specification>) => {
    console.log('[useSpecificationsSupabase] updateSpecificationInDb called for id:', id);
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.rows !== undefined) dbUpdates.rows = updates.rows;
    dbUpdates.updated_at = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('specifications')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('[useSpecificationsSupabase] Update error:', error.message);
        return;
      }
      await loadSpecifications();
    } catch (err: any) {
      console.error('[useSpecificationsSupabase] Update unexpected error:', err);
    }
  };

  const deleteSpecificationFromDb = async (id: string) => {
    console.log('[useSpecificationsSupabase] deleteSpecificationFromDb called for id:', id);
    if (!user) return;
    try {
      const { error } = await supabase
        .from('specifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('[useSpecificationsSupabase] Delete error:', error.message);
        return;
      }
      await loadSpecifications();
    } catch (err: any) {
      console.error('[useSpecificationsSupabase] Delete unexpected error:', err);
    }
  };

  return {
    loadSpecifications,
    addSpecificationToDb,
    updateSpecificationInDb,
    deleteSpecificationFromDb,
  };
};
