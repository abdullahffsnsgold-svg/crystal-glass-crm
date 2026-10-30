import { supabase } from "@/lib/supabase";

let cachedShopId: string | null = null;

/**
 * Id единственного магазина. Нужен только при создании заказа,
 * потому что orders.shop_id обязателен.
 */
export async function getShopId(): Promise<string | null> {
  if (cachedShopId) return cachedShopId;

  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  cachedShopId = String(data.id);

  return cachedShopId;
}
