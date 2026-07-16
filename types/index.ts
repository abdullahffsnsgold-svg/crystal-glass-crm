export interface Order {
  id: number;
  total_price: number | string;
  paid_amount: number | string;
  is_done: boolean;
  finished_at?: string;
  // Добавь все поля, которые есть у тебя в базе
  order_items: { price: number | string }[];
  payments: { id: number; amount: number; created_at: string }[];
}
