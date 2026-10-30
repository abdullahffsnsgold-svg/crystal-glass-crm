import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "shop_id";

let cachedShopId: string | null = null;

/**
 * Возвращает id магазина без экрана входа:
 * сохранённый в браузере -> NEXT_PUBLIC_SHOP_ID -> первый магазин из базы.
 */
export async function getShopId(): Promise<string | null> {
  if (cachedShopId) return cachedShopId;
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    cachedShopId = stored;
    return cachedShopId;
  }

  const configured = process.env.NEXT_PUBLIC_SHOP_ID;
  if (configured) {
    cachedShopId = configured;
    return cachedShopId;
  }

  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  cachedShopId = String(data.id);
  window.localStorage.setItem(STORAGE_KEY, cachedShopId);

  return cachedShopId;
}
