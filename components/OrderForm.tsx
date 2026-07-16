"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";
import { PatternFormat } from "react-number-format";
import { supabase } from "@/lib/supabase";

interface GlassItem {
  glass_id: string;
  width: number;
  height: number;
  quantity: number;
  price: number;
}

interface GlassType {
  id: number;
  name: string;
  price_per_sqm: number;
}

export default function OrderForm({ onClose }: { onClose: () => void }) {
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [items, setItems] = useState<GlassItem[]>([
    { glass_id: "", width: 0, height: 0, quantity: 1, price: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("glass_types")
      .select("*")
      .then(({ data }) => {
        if (data) setGlassTypes(data);
      });
  }, []);

  const calculatePrice = (
    glassId: string,
    w: number,
    h: number,
    qty: number,
  ): number => {
    const type = glassTypes.find((t) => String(t.id) === String(glassId));
    if (!type || w <= 0 || h <= 0) return 0;

    return Math.round(((w * h) / 10000) * type.price_per_sqm * qty);
  };

  const updateItem = (
    index: number,
    field: keyof GlassItem,
    value: string | number,
  ) => {
    const newItems = [...items];

    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;

    newItems[index] = {
      ...newItems[index],
      [field]: field === "glass_id" ? value : numValue,
    };

    newItems[index].price = calculatePrice(
      newItems[index].glass_id,
      newItems[index].width,
      newItems[index].height,
      newItems[index].quantity,
    );

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { glass_id: "", width: 0, height: 0, quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const shopId = localStorage.getItem("shop_id");

    if (!shopId) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        shop_id: shopId,
        client_name: formData.get("client_name"),
        client_phone: formData.get("client_phone"),
        is_urgent: formData.get("is_urgent") === "on",
        comment: formData.get("comment"),
      })
      .select()
      .single();

    if (!order || error) {
      setLoading(false);
      return;
    }

    await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        glass_type:
          glassTypes.find((t) => String(t.id) === i.glass_id)?.name ||
          "Unknown",
        width: i.width,
        height: i.height,
        quantity: i.quantity,
        price: i.price,
      })),
    );

    setLoading(false);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4">
      <motion.form
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-4xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Sparkles size={16} />
              Новый заказ
            </div>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Создание заказа
            </h2>
            <p className="text-sm text-slate-500">
              Заполните данные клиента и позиции стекла.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          {/* CLIENT BLOCK */}

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <h3 className="mb-5 text-xl font-bold text-slate-900">
              Данные клиента
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* NAME */}
              <input
                name="client_name"
                placeholder="Имя клиента"
                required
                className="h-14 rounded-2xl border border-slate-300 bg-white px-5 text-slate-900 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {/* PHONE */}
              <PatternFormat
                name="client_phone"
                format="+996 (###) ##-##-##"
                mask="_"
                placeholder="+996 (___) __-__-__"
                allowEmptyFormatting={true}
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 text-slate-900 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* URGENT */}

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="font-bold text-red-700">Срочный заказ</p>
                <p className="text-sm text-red-500">
                  Повышенный приоритет выполнения
                </p>
              </div>

              <input
                type="checkbox"
                name="is_urgent"
                className="h-5 w-5 accent-red-500"
              />
            </div>
          </div>
          {/* ================= ITEMS ================= */}

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Стекло в заказе
                </h3>
                <p className="text-sm text-slate-500">
                  Добавьте позиции для расчёта стоимости
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="h-11 rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
              >
                + Добавить
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-xl sm:p-6"
              >
                {/* HEADER */}

                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold text-slate-900">
                    Позиция #{index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex items-center gap-1 text-red-500 transition hover:text-red-600"
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>

                {/* GRID */}

                <div className="grid gap-4 md:grid-cols-6">
                  {/* GLASS TYPE */}
                  <select
                    className="
            md:col-span-2
            h-12 rounded-2xl border border-slate-300
            px-4 text-slate-900 font-medium
            focus:ring-4 focus:ring-blue-100
            outline-none
          "
                    onChange={(e) =>
                      updateItem(index, "glass_id", e.target.value)
                    }
                    required
                  >
                    <option value="">Тип стекла</option>

                    {glassTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  {/* WIDTH */}
                  <input
                    type="number"
                    placeholder="Ширина"
                    className="
            h-12 rounded-2xl border border-slate-300
            px-4 text-slate-900 font-medium
            focus:ring-4 focus:ring-blue-100
            outline-none
          "
                    onChange={(e) => updateItem(index, "width", e.target.value)}
                  />

                  {/* HEIGHT */}
                  <input
                    type="number"
                    placeholder="Высота"
                    className="
            h-12 rounded-2xl border border-slate-300
            px-4 text-slate-900 font-medium
            focus:ring-4 focus:ring-blue-100
            outline-none
          "
                    onChange={(e) =>
                      updateItem(index, "height", e.target.value)
                    }
                  />

                  {/* QTY */}
                  <input
                    type="number"
                    value={item.quantity}
                    className="
            h-12 rounded-2xl border border-slate-300
            px-4 text-center text-slate-900 font-bold
            focus:ring-4 focus:ring-blue-100
            outline-none
          "
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />

                  {/* PRICE */}
                  <div className="md:col-span-2 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Стоимость</p>

                      <p className="text-xl font-black text-blue-600">
                        {item.price} сом
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* ================= COMMENT ================= */}

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Комментарий
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Дополнительная информация к заказу
            </p>

            <textarea
              name="comment"
              rows={3}
              placeholder="Например: доставить после 18:00..."
              className="
      w-full
      rounded-2xl
      border border-slate-300
      p-4
      text-slate-900
      font-medium
      outline-none
      focus:ring-4 focus:ring-blue-100
    "
            />
          </div>

          {/* ================= SUMMARY ================= */}

          <div className="mt-6 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm text-slate-500">Итоговая сумма</p>

              <p className="text-3xl font-black text-slate-900">
                {items.reduce((sum, i) => sum + i.price, 0)} сом
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500">Позиции</p>

              <p className="text-xl font-bold text-slate-900">{items.length}</p>
            </div>
          </div>

          {/* ================= SUBMIT ================= */}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[28px] bg-linear-to-r from-blue-600 to-cyan-500 py-5 text-lg font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Создание заказа...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Оформить заказ
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
