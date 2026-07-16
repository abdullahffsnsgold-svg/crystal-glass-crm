"use client";

import { useRef, useState, useEffect, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginGate({ children }: { children: ReactNode }) {
  // Инициализируем false, так как на сервере мы не знаем, авторизован ли пользователь
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shopIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Проверка авторизации после монтирования в браузере
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsMounted(true);
      const storedShopId = window.localStorage.getItem("shop_id");
      setIsAuthenticated(Boolean(storedShopId));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleLogin = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setStatusMessage(null);

    const shopId = shopIdRef.current?.value.trim();
    const password = passwordRef.current?.value.trim();

    if (!shopId || !password) {
      setStatusMessage("Введите код магазина и пароль");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("id", shopId)
      .eq("password", password)
      .maybeSingle();

    setLoading(false);

    if (error) {
      setStatusMessage("Ошибка соединения с сервером");
      return;
    }

    if (data) {
      window.localStorage.setItem("shop_id", shopId);
      setSuccess(true);
      setIsAuthenticated(true);
      window.location.assign("/");
    } else {
      setStatusMessage("Неверный код магазина или пароль");
    }
  };

  // Пока не смонтировано, ничего не рендерим, чтобы избежать ошибки гидратации
  if (!isMounted) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200 px-6">
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-40 -top-40 h-105 w-105 rounded-full bg-blue-400/30 blur-[130px]"
      />

      <motion.div
        animate={{
          x: [0, -70, 60, 0],
          y: [0, 80, -30, 0],
          scale: [1.15, 1, 1.15],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-0 h-130 w-130 rounded-full bg-cyan-300/30 blur-[150px]"
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 70,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute h-225 w-225 rounded-full border border-white/20"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={
          success
            ? {
                scale: 0.9,
                opacity: 0,
                filter: "blur(12px)",
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: "blur(0px)",
              }
        }
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-md overflow-hidden rounded-[36px] border border-white/60 bg-white/75 p-10 shadow-[0_40px_90px_rgba(0,0,0,.16)] backdrop-blur-3xl"
      >
        <motion.div
          animate={{
            y: [0, -6, 0],
            boxShadow: [
              "0 15px 40px rgba(37,99,235,.25)",
              "0 25px 60px rgba(37,99,235,.45)",
              "0 15px 40px rgba(37,99,235,.25)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-linear-to-br from-blue-600 to-cyan-500"
        >
          <ShieldCheck size={42} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <h1 className="text-3xl font-black text-slate-900">Crystal Glass</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Авторизация в CRM системе управления заказами
          </p>
        </motion.div>

        <form className="mt-10 space-y-5" onSubmit={handleLogin}>
          <div className="relative">
            <Store size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={shopIdRef}
              type="text"
              placeholder="Код магазина"
              autoComplete="username"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pl-12 pr-4 text-slate-800 font-medium shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={passwordRef}
              type="password"
              placeholder="Пароль"
              autoComplete="current-password"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pl-12 pr-4 text-slate-800 font-medium shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {statusMessage ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {statusMessage}
            </p>
          ) : null}

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-xl shadow-blue-500/30 transition-all disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
                Проверка...
              </>
            ) : (
              <>
                Войти
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Безопасное подключение</p>
              <p className="mt-1 text-xs text-slate-500">
                Данные проверяются через Supabase и не сохраняются в браузере кроме ID магазина.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}