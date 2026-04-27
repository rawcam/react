import { supabase } from '../App';

/**
 * Выполняет запрос к Supabase с тайм‑аутом 8 секунд.
 * При ошибке JWT-expired/401 пробует обновить сессию и повторить запрос один раз.
 */
export async function withAuthRetry<T>(
  queryFn: (signal: AbortSignal) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const MAX_RETRIES = 1;
  const REQUEST_TIMEOUT = 8000; // 8 секунд на одну попытку

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const { data, error } = await queryFn(controller.signal);

      if (!error && data !== null && data !== undefined) {
        return data;
      }

      // Если ошибка связана с токеном – пробуем обновить сессию и повторить
      if (
        error?.message?.includes('JWT expired') ||
        error?.status === 401
      ) {
        if (attempt < MAX_RETRIES) {
          try {
            await supabase.auth.refreshSession();
          } catch (refreshError) {
            // не критично, продолжаем
          }
          continue; // повторяем запрос
        }
        throw new Error('SESSION_EXPIRED');
      }

      // Любая другая ошибка
      throw error || new Error('NO_DATA');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // тайм‑аут
        if (attempt < MAX_RETRIES) {
          await supabase.auth.refreshSession();
          continue;
        }
        throw new Error('SESSION_EXPIRED');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('UNREACHABLE');
}
