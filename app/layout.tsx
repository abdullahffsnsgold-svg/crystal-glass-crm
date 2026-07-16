import "./globals.css";
import LoginGate from "@/components/LoginGate";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <LoginGate>{children}</LoginGate>
      </body>
    </html>
  );
}
