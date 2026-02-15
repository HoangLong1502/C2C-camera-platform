import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "C2C Camera Platform",
  description: "Buy and sell cameras with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppHeader />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
