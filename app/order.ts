export interface OrderItem {
  id: number;
  glass_type: string;
  width: number;
  height: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  created_at: string;
  finished_at?: string | null;
  is_paid: boolean;
  client_name: string;
  client_phone: string;
  shop_id: string;
  is_urgent: boolean;
  is_done: boolean;
  order_items: OrderItem[];
  total_price: number;
  paid_amount: number;
  payments: { id: number; amount: number; created_at: string }[];
}
