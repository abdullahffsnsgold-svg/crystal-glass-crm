"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Sparkles,
  Wallet,
  CircleDollarSign,
  Plus,
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
  quantity: number;
  glass_type?: string;
}

type DebtOrder = Order & {
  order_items: OrderItem[];
  payments: Payment[];
};

export default function DebtsPage() {
  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [search, setSearch] = useState("");
  const [paymentInputs, setPaymentInputs] = useState<Record<number, string>>(
    {},
  ); // Состояние для инпутов
  const isLoaded = useRef(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const getDebt = (order: DebtOrder): number => {
    const itemsSum =
      order.order_items?.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + price * qty;
      }, 0) || 0;

    const paid = Number(order.paid_amount) || 0;

    return Math.max(itemsSum - paid, 0);
  };

  const loadDebts = async () => {
    const shopId = localStorage.getItem("shop_id");
    if (!shopId) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setOrders([...data] as DebtOrder[]);
    }
  };

  const handlePayment = async (order: DebtOrder) => {
    const amount = Number(paymentInputs[order.id]);
    if (!amount || amount <= 0) return;

    // 1. Добавляем запись в таблицу платежей
    const { error: payError } = await supabase
      .from("payments")
      .insert({ order_id: order.id, amount: amount });

    if (payError) {
      alert("Ошибка при сохранении оплаты");
      return;
    }

    // 2. Обновляем общую сумму оплат в заказе
    const newPaidAmount = (Number(order.paid_amount) || 0) + amount;
    await supabase
      .from("orders")
      .update({ paid_amount: newPaidAmount })
      .eq("id", order.id);

    // 3. Очищаем инпут и обновляем список
    setPaymentInputs((prev) => ({ ...prev, [order.id]: "" }));
    await loadDebts();
  };

  useEffect(() => {
    if (!isLoaded.current) {
      void loadDebts();
      isLoaded.current = true;
    }
  }, []);

  const debtors = useMemo(() => {
    return orders.filter((order) => {
      if (order.is_done) return false;

      const debt = getDebt(order);
      if (debt <= 0) return false;

      const q = search.toLowerCase();

      return (
        order.client_name?.toLowerCase().includes(q) ||
        order.client_phone?.includes(q)
      );
    });
  }, [orders, search]);

  const totalDebt = useMemo(() => {
    return debtors.reduce((sum, order) => sum + getDebt(order), 0);
  }, [debtors]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.14),transparent_32%),linear-gradient(135deg,#fef8f8_0%,#f8f5f5_45%,#f1f5f9_100%)] px-4 py-6 md:px-8 md:py-10">
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
              <SlideOutMenu title="Долги" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600">
                <Sparkles size={16} />
                Клиентские долги
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Активные должники
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Контролируйте остаток по каждому заказу и историю оплат.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void loadDebts()}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Обновить
            </button>
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{debtors.length} должников</p>
              <p>с активным долгом</p>
            </div>
          </div>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border border-red-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Общий долг</p>
                <p className="mt-2 text-2xl font-black text-red-600">
                  {totalDebt.toLocaleString()} c
                </p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
                <Wallet size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Оплачено</p>
                <p className="mt-2 text-2xl font-black text-emerald-700">
                  {orders
                    .reduce(
                      (sum, order) => sum + Number(order.paid_amount || 0),
                      0,
                    )
                    .toLocaleString()}{" "}
                  c
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <CircleDollarSign size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Заказов в работе
                </p>
                <p className="mt-2 text-2xl font-black">{debtors.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <Sparkles size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-4xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Поиск по клиенту
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Быстро находите должников по имени или телефону.
              </p>
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Имя или телефон"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 md:min-w-55"
              />
            </label>
          </div>
        </section>

        {debtors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {debtors.map((order, index) => {
              const debt = getDebt(order);
              const payments = [...(order.payments || [])].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              );

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col gap-4"
                >
                  <OrderCard order={order} onUpdate={() => void loadDebts()} />

                  <div className="rounded-[28px] border border-red-100 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                        Остаток
                      </p>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        {debt.toLocaleString()} c
                      </span>
                    </div>

                    <div className="max-h-32 space-y-2 overflow-auto pr-2 mb-4">
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between border-b border-slate-100 py-2 text-sm text-slate-600"
                          >
                            <span>{formatDate(payment.created_at)}</span>
                            <span className="font-bold text-slate-900">
                              {Number(payment.amount).toLocaleString()} c
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm italic text-slate-400">
                          Нет оплат
                        </p>
                      )}
                    </div>

                    {/* Инпут для оплаты */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Сумма"
                        value={paymentInputs[order.id] || ""}
                        onChange={(e) =>
                          setPaymentInputs((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handlePayment(order)}
                        className="flex items-center justify-center rounded-2xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-6 text-center shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Wallet size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Нет активных долгов
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Все заказы закрыты или уже оплачены.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
