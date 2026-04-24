import { supabase } from '../App';

const REQUEST_TIMEOUT = 8000; // 8 секунд на запрос
const REFRESH_TIMEOUT = 5000; // 5 секунд на обновление токена

async function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId!));
}

export async function withAuthRetry<T>(
  queryFn: () => Promise<{ data: T; error: any }>
): Promise<T> {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await withTimeout(
      queryFn(),
      REQUEST_TIMEOUT,
      'TIMEOUT'
    );

    if (!error) return data;

    if (error?.message?.includes('JWT expired') || error?.status === 401) {
      if (attempt < MAX_RETRIES) {
        try {
          const refreshRes = await withTimeout(
            supabase.auth.refreshSession(),
            REFRESH_TIMEOUT,
            'REFRESH_TIMEOUT'
          );
          if (refreshRes.data.session) continue;
        } catch (refreshError) {
          // обновить не удалось
        }
      }
      throw new Error('SESSION_EXPIRED');
    }
    // все остальные ошибки – сразу выбрасываем
    throw error;
  }
  throw new Error('UNREACHABLE');
}
