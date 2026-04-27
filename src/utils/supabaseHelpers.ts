// src/utils/supabaseHelpers.ts
import { supabase } from '../App';

const REQUEST_TIMEOUT = 8000;     // 8 секунд на запрос
const REFRESH_TIMEOUT = 5000;    // 5 секунд на обновление токена

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
  const MAX_RETRIES = 2; // одна попытка после тайм-аута/ошибки токена

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await withTimeout(queryFn(), REQUEST_TIMEOUT);

      if (!error && data !== null && data !== undefined) return data;

      // Если запрос упал не из-за прав, а из-за токена – пробуем обновить сессию
      if (error?.message?.includes('JWT expired') || error?.status === 401) {
        if (attempt < MAX_RETRIES) {
          await refreshSessionSafe();
          continue; // повторяем запрос с новым токеном
        }
        throw new Error('SESSION_EXPIRED');
      }

      // Пустой или null ответ без ошибки
      if (!error && (data === null || data === undefined)) {
        throw new Error('NO_DATA');
      }

      // Любая другая ошибка
      throw error;

    } catch (err: any) {
      // Тайм-аут: возможно, токен протух и запрос завис, пробуем обновить и повторить
      if (err.message === 'TIMEOUT') {
        if (attempt < MAX_RETRIES) {
          await refreshSessionSafe();
          continue;
        }
        throw new Error('SESSION_EXPIRED');
      }

      // Другие ошибки, включая SESSION_EXPIRED, NO_DATA – пробрасываем дальше
      throw err;
    }
  }

  throw new Error('UNREACHABLE');
}

async function refreshSessionSafe() {
  try {
    await withTimeout(supabase.auth.refreshSession(), REFRESH_TIMEOUT);
  } catch (e) {
    // не удалось обновить – ничего не делаем, следующая попытка запроса сама упадет
  }
}
