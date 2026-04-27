import { supabase } from '../App';

const REQUEST_TIMEOUT = 8000;

export async function withAuthRetry<T>(
  queryFn: ((signal: AbortSignal) => Promise<{ data: T | null; error: any }>) | (() => Promise<{ data: T | null; error: any }>)
): Promise<T> {
  const MAX_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      let result;
      if (queryFn.length === 1) {
        // функция принимает signal
        result = await (queryFn as (signal: AbortSignal) => Promise<{ data: T | null; error: any }>)(controller.signal);
      } else {
        // старый вариант без signal – оборачиваем в наш контроллер
        result = await Promise.race([
          (queryFn as () => Promise<{ data: T | null; error: any }>)(),
          new Promise<never>((_, reject) => {
            const onAbort = () => reject(new Error('TIMEOUT'));
            controller.signal.addEventListener('abort', onAbort, { once: true });
          }),
        ]);
      }

      const { data, error } = result;

      if (!error && data !== null && data !== undefined) return data;

      if (error?.message?.includes('JWT expired') || error?.status === 401) {
        if (attempt < MAX_RETRIES) {
          await supabase.auth.refreshSession();
          continue;
        }
        throw new Error('SESSION_EXPIRED');
      }

      throw error || new Error('NO_DATA');
    } catch (err: any) {
      if (err.message === 'TIMEOUT' || err.name === 'AbortError') {
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
