// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

const REQUEST_TIMEOUT = 15000; // 15 секунд, чтобы хватило даже на медленном интернете

export async function withAuthRetry<T>(
  queryFn: (signal: AbortSignal) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT);

  try {
    const { data, error } = await queryFn(abortController.signal);

    if (!error && data !== null && data !== undefined) {
      return data;
    }

    // Пытаемся восстановить сессию только при проблемах с токеном
    if (error?.message?.includes('JWT expired') || error?.status === 401) {
      await supabase.auth.refreshSession();
      const retry = await queryFn(abortController.signal);
      if (!retry.error && retry.data !== null && retry.data !== undefined) {
        return retry.data;
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw error || new Error('NO_DATA');
  } finally {
    clearTimeout(timer);
  }
}
