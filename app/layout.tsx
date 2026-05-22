import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CATG OmniVentas SaaS",
  description: "Catálogo + IA vendedora + CRM para tiendas"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
