"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/app/order";
import { Trash2, Pencil } from "lucide-react";

interface Props {
  order: Order;
  onUpdate: () => void;
  onEdit?: (order: Order) => void;
}

export default function OrderCard({ order, onUpdate, onEdit }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= TOTAL =================
  const total = useMemo(() => {
    return (
      order.order_items?.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 1);
      }, 0) || 0
    );
  }, [order.order_items]);

  // ================= WHATSAPP =================
  const sendWhatsApp = () => {
    const items =
      order.order_items
        ?.map(
          (i) =>
            `• ${i.glass_type} — ${i.width}×${i.height} (${i.quantity} шт.) = ${Number(i.price) * i.quantity} c`,
        )
        .join("\n") || "";

    const message = `Здравствуйте, ${order.client_name || "клиент"} 👋

Ваш заказ готов:

${items}

------------------
Итого: ${total} c

Спасибо за заказ!`;

    let phone = order.client_phone?.replace(/\D/g, "");
    if (!phone) return;

    if (phone.startsWith("0")) {
      phone = "996" + phone.slice(1);
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  // ================= TOGGLE DONE =================
  const toggleDone = async () => {
    if (loading) return;
    setLoading(true);

    const newStatus = !order.is_done;

    const { error } = await supabase
      .from("orders")
      .update({ is_done: newStatus })
      .eq("id", order.id);

    if (!error) {
      if (newStatus) sendWhatsApp(); // отправляем только при завершении
      onUpdate();
    }

    setLoading(false);
  };

  // ================= DELETE =================
  const deleteOrder = async () => {
    const ok = confirm("Удалить заказ?");
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase.from("orders").delete().eq("id", order.id);

    if (!error) {
      onUpdate();
    }

    setLoading(false);
  };

  return (
    <div
      className={`
        relative
        rounded-3xl
        border
        bg-white
        p-4
        shadow-sm
        transition
        hover:-translate-y-1
        hover:shadow-xl
        sm:p-6
        ${order.is_urgent ? "border-red-300" : "border-slate-200"}
      `}
    >
      {/* URGENT */}
      {order.is_urgent && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full">
            🔥 срочно
          </span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-lg font-black text-slate-900">
          {order.client_name}
        </h3>
        <p className="text-sm text-slate-500">{order.client_phone}</p>
      </div>

      {/* ITEMS */}
      <div className="space-y-2">
        {order.order_items?.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">
                {item.glass_type}
              </span>
              <span className="font-bold text-slate-700">×{item.quantity}</span>
            </div>

            <div className="text-sm text-slate-500 mt-1">
              {item.width} × {item.height}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between">
        {/* STATUS */}
        <div>
          <p className="text-xs text-slate-400">Статус</p>
          <p
            className={`font-bold ${
              order.is_done ? "text-green-600" : "text-orange-500"
            }`}
          >
            {order.is_done ? "Выполнен" : "В работе"}
          </p>
        </div>

        {/* TOTAL */}
        <div className="text-right">
          <p className="text-xs text-slate-400">Итого</p>
          <p className="text-xl font-black text-blue-600">{total} c</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {/* DONE */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className={`
    w-full
    rounded-2xl
    py-3
    font-bold
    text-white
    transition
    active:scale-95
    sm:flex-1
    ${order.is_done ? "bg-orange-500" : "bg-black"}
  `}
        >
          ✓ {order.is_done ? "Вернуть" : "Готово"}
        </button>

        {/* EDIT */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(order)}
            className="
              rounded-2xl
              bg-slate-100
              px-4
              py-3
              transition
              hover:bg-slate-200
            "
          >
          <Pencil size={16} />
        </button>

        {/* DELETE */}
          <button
            onClick={deleteOrder}
            className="
              rounded-2xl
              bg-red-50
              px-4
              py-3
              text-red-600
              transition
              hover:bg-red-100
            "
          >
            <Trash2 size={16} />
          </button>
        </div>
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmOpen(false)}
            />

            {/* MODAL */}
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-black text-slate-900">
                Подтверждение
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Вы хотите завершить заказ и отправить сообщение клиенту?
              </p>

              <div className="mt-6 flex gap-3">
                {/* CANCEL */}
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Отмена
                </button>

                {/* CONFIRM */}
                <button
                  onClick={async () => {
                    setConfirmOpen(false);
                    await toggleDone();
                  }}
                  className="flex-1 rounded-2xl bg-black py-3 font-bold text-white hover:bg-slate-800"
                >
                  Да, готово
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
