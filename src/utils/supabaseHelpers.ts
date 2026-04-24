// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

const REQUEST_TIMEOUT = 8000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let id: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(id!);
  }
}

export async function withAuthRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const MAX_RETRIES = 1;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await withTimeout(queryFn(), REQUEST_TIMEOUT);

    if (!error && data !== null && data !== undefined) return data;

    if (error?.message?.includes('JWT expired') || error?.status === 401) {
      if (attempt < MAX_RETRIES) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) continue;
        } catch {}
      }
      throw new Error('SESSION_EXPIRED');
    }

    if (error) throw error;
    // если нет ошибки, но data пустая — возвращаем как есть (может быть пустой массив)
    if (data === null || data === undefined) throw new Error('NO_DATA');
  }
  throw new Error('UNREACHABLE');
}
