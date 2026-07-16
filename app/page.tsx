"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import { ClipboardList, History, Plus, Search, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import OrderCard from "@/components/OrderCard";
import OrderForm from "@/components/OrderForm";
import SlideOutMenu from "@/components/SlideOutMenu";
import toast from "react-hot-toast";
import type { Order } from "./order";

type StatCardProps = {
  title: string;
  value: number;
  icon: ElementType;
  accent: string;
};

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-lg ${accent}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFetched = useRef(false);

  const handleLogout = () => {
    localStorage.removeItem("shop_id");
    window.location.assign("/");
  };

  const loadData = async () => {
    const shopId = localStorage.getItem("shop_id");
    if (!shopId) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*)");

    if (error) {
      toast.error("Ошибка загрузки заказов");
      return;
    }

    const filtered = (data ?? []).filter(
      (order) => String(order.shop_id) === String(shopId),
    ) as Order[];

    setOrders(filtered);
  };

  useEffect(() => {
    if (!isFetched.current) {
      void loadData();
      isFetched.current = true;
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          void loadData();

          if (payload.eventType === "INSERT") toast.success("Новый заказ");
          if (payload.eventType === "UPDATE") toast("Обновлено");
          if (payload.eventType === "DELETE") toast.error("Удалено");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeOrders = orders.filter((order) => !order.is_done);
  const doneOrders = orders.filter((order) => order.is_done);
  const urgentOrders = orders.filter((order) => order.is_urgent);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase();

    return [...orders]
      .filter((order) => {
        if (order.is_done) return false;

        return (
          order.client_name.toLowerCase().includes(query) ||
          order.client_phone.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => Number(b.is_urgent) - Number(a.is_urgent));
  }, [orders, search]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#f3f7fb_45%,#eef3f8_100%)] px-3 py-4 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SlideOutMenu onNewOrder={() => setIsModalOpen(true)} onLogout={handleLogout} />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25">
              <ClipboardList size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900">Crystal glass</h1>
              <p className="text-xs text-slate-500">Активные заказы</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <label className="flex h-10 items-center rounded-2xl border border-slate-200 bg-white/90 px-4 shadow-sm sm:min-w-55">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search"
              />
            </label>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Новый заказ
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 grid max-w-7xl gap-4 px-0 sm:px-0 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total"
            value={orders.length}
            icon={ClipboardList}
            accent="bg-slate-900"
          />
          <StatCard
            title="Active"
            value={activeOrders.length}
            icon={History}
            accent="bg-blue-600"
          />
          <StatCard
            title="Done"
            value={doneOrders.length}
            icon={Wallet}
            accent="bg-green-600"
          />
          <StatCard
            title="Urgent"
            value={urgentOrders.length}
            icon={ClipboardList}
            accent="bg-red-500"
          />
        </section>

        <section className="mx-auto mt-10 max-w-7xl px-0 pb-20 sm:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Заказы</h2>
              <p className="mt-1 text-sm text-slate-500">
                Список заказов по текущему магазину
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-white sm:w-auto"
            >
              <Plus size={18} />
              Новый заказ
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -6 }}
                  className="relative"
                >
                  <OrderCard order={order} onUpdate={loadData} />
                </motion.div>
              ))
            ) : (
              <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-slate-500 shadow-sm sm:p-10 md:col-span-2 xl:col-span-3">
                Заказы не найдены
              </div>
            )}
          </div>
        </section>

        {isModalOpen && <OrderForm onClose={() => setIsModalOpen(false)} />}
      </main>
  );
}
