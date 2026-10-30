import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// без переменных окружения createClient падает невнятной ошибкой
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY. Добавьте их в .env.local (локально) или в переменные окружения хостинга.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);