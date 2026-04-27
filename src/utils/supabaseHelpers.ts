// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

const REQUEST_TIMEOUT = 25000; // 25 секунд

export async function withAuthRetry<T>(
  queryFn: (signal: AbortSignal) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const makeAttempt = async (retry = false): Promise<T> => {
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT);

    try {
      const { data, error } = await queryFn(abortController.signal);
      if (!error && data !== null && data !== undefined) {
        return data;
      }

      if (error?.message?.includes('JWT expired') || error?.status === 401) {
        if (!retry) {
          await supabase.auth.refreshSession();
          // Повторяем без таймаута
          return makeAttempt(true);
        }
        throw new Error('SESSION_EXPIRED');
      }

      throw error || new Error('NO_DATA');
    } finally {
      clearTimeout(timer);
    }
  };

  return makeAttempt(false);
}
