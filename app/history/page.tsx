"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  History as HistoryIcon,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import OrderCard from "@/components/OrderCard";
import SlideOutMenu from "@/components/SlideOutMenu";
import type { Order } from "../order";

interface Payment {
  id: number;
  amount: number;
  created_at: string;
}

interface OrderItem {
  id: number;
  price: number | string;
}

type HistoryOrder = Order & {
  order_items: OrderItem[];
  payments: Payment[];
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const isLoaded = useRef(false);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const calculateRemaining = (order: HistoryOrder): number => {
    const itemsPriceSum = (order.order_items || []).reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    return (
      itemsPriceSum +
      Number(order.total_price || 0) -
      Number(order.paid_amount || 0)
    );
  };

  const loadHistory = async () => {
    const shopId = localStorage.getItem("shop_id");
    if (!shopId) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка загрузки истории:", error);
      return;
    }

    if (data) {
      setOrders(data as unknown as HistoryOrder[]);
    }
  };

  useEffect(() => {
    if (!isLoaded.current) {
      void loadHistory();
      isLoaded.current = true;
    }
  }, []);

  const globalStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const remaining = calculateRemaining(order);
        const paid = Number(order.paid_amount || 0);

        return {
          paid: acc.paid + paid,
          debt: acc.debt + (remaining > 0 ? remaining : 0),
          completed: acc.completed + (order.is_done ? 1 : 0),
        };
      },
      { paid: 0, debt: 0, completed: 0 },
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return orders.filter((order) => {
      if (order.is_done !== true) return false;

      const remaining = calculateRemaining(order);
      if (remaining > 0) return false;

      const matchesSearch =
        order.client_name?.toLowerCase().includes(query) ||
        order.client_phone?.includes(query);

      const matchesDate =
        !selectedDate || order.created_at?.split("T")[0] === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [orders, searchTerm, selectedDate]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#f3f7fb_45%,#eef3f8_100%)] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-4xl border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowLeft size={18} />
              </Link>
              <SlideOutMenu title="История" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                <Sparkles size={16} />
                История заказов
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Закрытые заказы и оплаты
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Сводка по завершённым заказам, оплатам и задолженностям.
              </p>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:w-auto">
            <p className="font-semibold text-slate-900">{filteredOrders.length} закрытых</p>
            <p>по выбранным фильтрам</p>
          </div>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Заработано</p>
                <p className="mt-2 text-2xl font-black text-emerald-700">
                  {globalStats.paid.toLocaleString()} c
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <CircleDollarSign size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-red-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Долги</p>
                <p className="mt-2 text-2xl font-black text-red-600">
                  {globalStats.debt.toLocaleString()} c
                </p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
                <Wallet size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Закрыто</p>
                <p className="mt-2 text-2xl font-black">{globalStats.completed}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <HistoryIcon size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Платежей</p>
                <p className="mt-2 text-2xl font-black text-blue-600">
                  {orders.reduce((sum, order) => sum + (order.payments?.length || 0), 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
                <CalendarDays size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-4xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Фильтры</h2>
              <p className="mt-1 text-sm text-slate-500">
                Быстрый поиск по клиенту и дате закрытия.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск клиента"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 md:min-w-55"
                />
              </label>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <CalendarDays size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="bg-transparent text-sm outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDate("");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
              >
                Сбросить
              </button>
            </div>
          </div>
        </section>

        {filteredOrders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order, index) => {
              const sortedPayments = [...(order.payments || [])].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              );

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col gap-4"
                >
                  <OrderCard order={order} onUpdate={loadHistory} />

                  <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                        История оплат
                      </p>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {sortedPayments.length} платежа
                      </span>
                    </div>

                    <div className="max-h-36 space-y-2 overflow-auto pr-2">
                      {sortedPayments.length > 0 ? (
                        sortedPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between border-b border-slate-100 py-2 text-sm text-slate-600"
                          >
                            <span>{formatDate(payment.created_at)}</span>
                            <span className="font-bold text-slate-900">
                              {payment.amount.toLocaleString()} c
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm italic text-slate-400">Нет оплат</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Оплачено
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {Number(order.paid_amount || 0).toLocaleString()} c
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-6 text-center shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <HistoryIcon size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Пока нет закрытых заказов</h3>
            <p className="mt-2 text-sm text-slate-500">
              Попробуйте изменить фильтры или вернуться на главную страницу.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
            >
              На главную
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

