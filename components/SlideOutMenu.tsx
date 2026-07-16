"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  History as HistoryIcon,
  Home,
  LogOut,
  Menu,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SlideOutMenuProps {
  onNewOrder?: () => void;
  onLogout?: () => void;
  title?: string;
}

export default function SlideOutMenu({
  onNewOrder,
  onLogout,
  title = "Crystal Glass",
}: SlideOutMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/history", label: "История", icon: HistoryIcon },
    { href: "/debts", label: "Должники", icon: Wallet },
  ];

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-md transition"
        type="button"
      >
        <Menu size={19} className="text-slate-700" />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
              onClick={closeMenu}
              aria-label="Закрыть меню"
            />

            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-[85vw] max-w-[320px] flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Navigation</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{title}</h2>
                  <p className="mt-2 text-sm text-slate-500">Управление мастерской</p>
                </div>

                <motion.button
                  whileHover={{ rotate: 90, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeMenu}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"
                  type="button"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;

                  return (
                    <motion.div
                      key={href}
                      whileHover={{ x: 4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    >
                      <Link
                        href={href}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                {onNewOrder ? (
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeMenu();
                      onNewOrder();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                    type="button"
                  >
                    <Plus size={18} />
                    Новый заказ
                  </motion.button>
                ) : null}

                {onLogout ? (
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeMenu();
                      onLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                    type="button"
                  >
                    <LogOut size={18} />
                    Выйти
                  </motion.button>
                ) : null}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
              >
                <div className="flex items-center gap-2 text-slate-900">
                  <ClipboardList size={18} className="text-blue-600" />
                  <span className="font-semibold">Crystal Glass</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Быстрый доступ к заказам, истории и долгам.
                </p>
              </motion.div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
