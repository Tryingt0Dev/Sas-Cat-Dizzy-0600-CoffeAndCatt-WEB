import type { ReactNode } from "react";
import type { SaaSTheme } from "@/lib/themes/saas-themes";
import { getSaasThemeCssVariables } from "@/lib/themes/theme-utils";

export function SaaSThemeProvider({ theme, children }: { theme: SaaSTheme; children: ReactNode }) {
  const vars = getSaasThemeCssVariables(theme);

  return (
    <div style={vars}>
      {children}
    </div>
  );
}
