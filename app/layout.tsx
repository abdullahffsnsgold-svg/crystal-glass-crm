import "./globals.css";
import LoginGate from "@/components/LoginGate";

// Это "правильный" способ для Next.js, чтобы подключить манифест
export const metadata = {
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
        <LoginGate>{children}</LoginGate>
      </body>
    </html>
  );
}
