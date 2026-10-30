"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/app/order";
import { Trash2, Pencil, Banknote, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  order: Order;
  onUpdate: () => void;
  onEdit?: (order: Order) => void;
}

export default function OrderCard({ order, onUpdate, onEdit }: Props) {
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<"cash" | "card" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= TOTAL =================
  const total = useMemo(() => {
    return (
      order.order_items?.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 1);
      }, 0) || 0
    );
  }, [order.order_items]);

  const paid = Number(order.paid_amount || 0);
  const remaining = Math.max(total - paid, 0);
  const entered = Number(amount || 0);

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

  // ================= PAYMENT =================
  const openPayment = () => {
    setMethod(null);
    setAmount(String(remaining));
    setPayOpen(true);
  };

  const completeOrder = async (payAmount: number) => {
    if (loading) return;
    setLoading(true);

    if (payAmount > 0) {
      const { error: payError } = await supabase
        .from("payments")
        .insert({ order_id: order.id, amount: payAmount });

      if (payError) {
        toast.error("Ошибка при сохранении оплаты");
        setLoading(false);
        return;
      }
    }

    const newPaid = paid + payAmount;

    const { error } = await supabase
      .from("orders")
      .update({ is_done: true, paid_amount: newPaid })
      .eq("id", order.id);

    if (error) {
      toast.error("Не удалось завершить заказ");
      setLoading(false);
      return;
    }

    const left = Math.max(total - newPaid, 0);

    if (left > 0) {
      toast(`Заказ закрыт, остаток ${left.toLocaleString()} c`);
    } else {
      toast.success("Заказ закрыт и оплачен");
    }

    sendWhatsApp();
    setPayOpen(false);
    setMethod(null);
    setAmount("");
    setLoading(false);
    onUpdate();
  };

  const handleCardSubmit = () => {
    if (!entered || entered <= 0) {
      toast.error("Введите сумму оплаты");
      return;
    }

    void completeOrder(entered);
  };

  // ================= REOPEN =================
  const reopenOrder = async () => {
    if (loading) return;
    setLoading(true);

    const { error } = await supabase
      .from("orders")
      .update({ is_done: false })
      .eq("id", order.id);

    if (error) {
      toast.error("Не удалось вернуть заказ");
    } else {
      toast.success("Заказ возвращён в работу");
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
          {order.is_done && remaining > 0 && (
            <p className="text-xs font-semibold text-red-600">
              Долг {remaining.toLocaleString()} c
            </p>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {/* DONE */}
        <button
          onClick={() => (order.is_done ? void reopenOrder() : openPayment())}
          disabled={loading}
          className={`
    w-full
    rounded-2xl
    py-3
    font-bold
    text-white
    transition
    active:scale-95
    disabled:opacity-60
    sm:flex-1
    ${order.is_done ? "bg-orange-500" : "bg-black"}
  `}
        >
          ✓ {order.is_done ? "Вернуть" : "Готово"}
        </button>

        {/* EDIT + DELETE */}
        <div className="flex gap-2">
          {onEdit ? (
            <button
              onClick={() => onEdit(order)}
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
          ) : null}

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
      </div>

      {/* PAYMENT MODAL */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!loading) setPayOpen(false);
            }}
          />

          {/* MODAL */}
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Оплата заказа</h3>
            <p className="mt-1 text-sm text-slate-500">{order.client_name}</p>

            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Итого</span>
                <span className="font-bold text-slate-900">
                  {total.toLocaleString()} c
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Оплачено</span>
                <span className="font-bold text-slate-900">
                  {paid.toLocaleString()} c
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">К оплате</span>
                <span className="font-black text-blue-600">
                  {remaining.toLocaleString()} c
                </span>
              </div>
            </div>

            {method === null && (
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => void completeOrder(remaining)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Banknote size={18} />
                  Наличными
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-black py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <CreditCard size={18} />
                  Картой
                </button>

                <button
                  type="button"
                  onClick={() => setPayOpen(false)}
                  className="rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Отмена
                </button>
              </div>
            )}

            {method === "card" && (
              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Сумма оплаты
                </label>

                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  autoFocus
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold outline-none focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  {remaining <= 0
                    ? "Заказ уже оплачен полностью."
                    : entered >= remaining
                      ? "Сумма покрывает заказ — он уйдёт в историю."
                      : `Не хватает ${(remaining - entered).toLocaleString()} c — заказ уйдёт в должники.`}
                </p>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod(null)}
                    className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Назад
                  </button>

                  <button
                    type="button"
                    onClick={handleCardSubmit}
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-black py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    Подтвердить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
