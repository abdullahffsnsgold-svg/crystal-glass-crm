import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// Это "правильный" способ для Next.js, чтобы подключить манифест
export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Crystal Glass CRM",
  description: "CRM система",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Эти теги позволяют приложению "притворяться" нативным */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Crystal Glass" />
      </head>
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
