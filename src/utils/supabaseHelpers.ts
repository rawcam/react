// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

const REQUEST_TIMEOUT = 25000; // 25 секунд – достаточно для медленных сетей

export async function withAuthRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const { data, error } = await queryFn();

    if (!error && data !== null && data !== undefined) {
      return data;
    }

    // Только ошибка токена – одна попытка обновить сессию и повторить
    if (error?.message?.includes('JWT expired') || error?.status === 401) {
      try {
        await supabase.auth.refreshSession();
        const retry = await queryFn();
        if (!retry.error && retry.data !== null && retry.data !== undefined) {
          return retry.data;
        }
      } catch {}
      throw new Error('SESSION_EXPIRED');
    }

    throw error || new Error('NO_DATA');
  } finally {
    clearTimeout(timeoutId);
  }
}
