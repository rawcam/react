// src/hooks/useSpecificationsSupabase.ts
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabaseClient';
import { setSpecifications, Specification } from '../store/specificationsSlice';

export const useSpecificationsSupabase = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const loadSpecifications = async () => {
    if (!user) {
      console.warn('[Specs] No user, skipping load');
      return;
    }
    console.log('[Specs] Loading for user:', user.id);
    const { data, error } = await supabase
      .from('specifications')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Specs] Load error:', error.message, error.details, error.hint);
      return;
    }
    console.log('[Specs] Loaded', data?.length, 'specifications');
    const specs = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      projectId: item.project_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      rows: item.rows || [],
    }));
    dispatch(setSpecifications(specs));
  };

  // ... остальные функции ...
};
