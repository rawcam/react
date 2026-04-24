// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

/**
 * Выполняет запрос к Supabase, при ошибке "JWT expired" или 401
 * автоматически обновляет сессию и повторяет запрос.
 * Если сессию обновить не удалось – выбрасывает ошибку SESSION_EXPIRED.
 */
export async function withAuthRetry<T>(
  queryFn: () => Promise<{ data: T; error: any }>
): Promise<T> {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await queryFn();
    if (!error) return data;

    // Проверяем, связана ли ошибка с токеном
    if (
      error?.message?.includes('JWT expired') ||
      error?.status === 401
    ) {
      if (attempt < MAX_RETRIES) {
        // Пытаемся обновить сессию
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          continue; // повторяем запрос с новым токеном
        }
      }
      throw new Error('SESSION_EXPIRED');
    }
    // Любая другая ошибка – выбрасываем сразу
    throw error;
  }
  throw new Error('UNREACHABLE');
}
