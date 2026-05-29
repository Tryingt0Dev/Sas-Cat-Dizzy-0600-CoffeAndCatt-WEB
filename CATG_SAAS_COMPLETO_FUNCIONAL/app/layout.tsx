import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import FloatingPlatformAdminGate from "@/components/FloatingPlatformAdminGate";
import { getSaasThemeBySlug, getSaasThemeCssVariables, defaultSaasThemeSlug } from "@/lib/themes/theme-utils";

export const metadata: Metadata = {
  title: "CATG OmniVentas SaaS",
  description: "Catálogo + IA vendedora + CRM para tiendas"
};

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const theme = getSaasThemeBySlug(user?.saasTheme ?? defaultSaasThemeSlug);
  const themeStyle = getSaasThemeCssVariables(theme);

  return (
    <html lang="es">
      <body style={themeStyle}>
        {children}
        <FloatingPlatformAdminGate />
      </body>
    </html>
  );
}
