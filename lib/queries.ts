"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Order } from "@/app/order";

export interface GlassType {
  id: number;
  name: string;
  price_per_sqm: number;
}

// один ключ на все экраны: заказ, открытый на главной, не перезапрашивается в долгах
export const ordersQueryKey = ["orders"] as const;
export const glassTypesQueryKey = ["glass_types"] as const;

async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), payments(*)")
    // новые заказы сверху: без сортировки порядок строк в ответе произвольный
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Order[];
}

async function fetchGlassTypes(): Promise<GlassType[]> {
  const { data, error } = await supabase
    .from("glass_types")
    .select("id, name, price_per_sqm")
    .order("id");

  if (error) throw error;

  return (data ?? []) as GlassType[];
}

export function useOrders() {
  return useQuery({ queryKey: ordersQueryKey, queryFn: fetchOrders });
}

export function useGlassTypes() {
  return useQuery({
    queryKey: glassTypesQueryKey,
    queryFn: fetchGlassTypes,
    // прайс меняется вручную и редко — держим в кэше всю сессию
    staleTime: Infinity,
  });
}

/**
 * Живые обновления из базы. Данные не дублируются в состоянии: любой
 * изменённый заказ или платёж просто помечает кэш устаревшим, и React Query
 * сам перезапрашивает его один раз на все открытые экраны.
 */
export function useOrdersLive(toasts = false) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // уникальное имя: два одинаковых канала на странице Supabase не уживаются
    const channel = supabase
      .channel(`orders-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: ordersQueryKey });

          if (!toasts) return;

          if (payload.eventType === "INSERT") toast.success("Новый заказ");
          if (payload.eventType === "UPDATE") toast("Обновлено");
          if (payload.eventType === "DELETE") toast.error("Удалено");
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ordersQueryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toasts]);
}
