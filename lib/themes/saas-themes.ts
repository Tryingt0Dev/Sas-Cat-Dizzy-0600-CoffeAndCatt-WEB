export type SaaSTheme = {
  slug: string;
  name: string;
  description: string;
  recommendedUsage: string;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    accent: string;
    success: string;
    border: string;
    ring: string;
    danger: string;
    warning: string;
  };
  cssVariables?: Record<string, string>;
  preview: string[];
};

export const saasThemes: SaaSTheme[] = [
  {
    slug: "violet-premium",
    name: "Violeta Premium",
    description: "Un panel moderno y elegante con acentos violetas, magenta y cyan para una experiencia fresca y premium.",
    recommendedUsage: "Perfecto para equipos creativos y comercios que buscan una interfaz clara y profesional.",
    colors: {
      background: "#F9FAFB",
      surface: "#FFFFFF",
      surfaceMuted: "#F3F4F6",
      text: "#111827",
      textMuted: "#4B5563",
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      accent: "#EC4899",
      success: "#22C55E",
      border: "#E5E7EB",
      ring: "#C7D2FE",
      danger: "#EF4444",
      warning: "#F59E0B"
    },
    preview: ["#111827", "#7C3AED", "#EC4899", "#F9FAFB", "#22D3EE"],
    cssVariables: {
      "--app-bg": "#F9FAFB",
      "--app-surface": "#FFFFFF",
      "--app-surface-muted": "#F3F4F6",
      "--app-text": "#111827",
      "--app-text-muted": "#4B5563",
      "--app-primary": "#7C3AED",
      "--app-primary-hover": "#6D28D9",
      "--app-accent": "#EC4899",
      "--app-success": "#22C55E",
      "--app-border": "#E5E7EB",
      "--app-ring": "#C7D2FE",
      "--app-danger": "#EF4444",
      "--app-warning": "#F59E0B"
    }
  },
  {
    slug: "coral-commerce",
    name: "Coral Commerce",
    description: "Un tema luminoso con coral suave, morado y verde vibrante para un panel cálido y cercano.",
    recommendedUsage: "Ideal para marcas de retail, lifestyle y negocios que buscan una identidad amable y activa.",
    colors: {
      background: "#FFF7ED",
      surface: "#FFFFFF",
      surfaceMuted: "#FEF3E9",
      text: "#1F2937",
      textMuted: "#475569",
      primary: "#FB7185",
      primaryHover: "#F43F5E",
      accent: "#A855F7",
      success: "#22C55E",
      border: "#E9D5CA",
      ring: "#FBCFE8",
      danger: "#DC2626",
      warning: "#F97316"
    },
    preview: ["#FFF7ED", "#FB7185", "#A855F7", "#1F2937", "#22C55E"],
    cssVariables: {
      "--app-bg": "#FFF7ED",
      "--app-surface": "#FFFFFF",
      "--app-surface-muted": "#FEF3E9",
      "--app-text": "#1F2937",
      "--app-text-muted": "#475569",
      "--app-primary": "#FB7185",
      "--app-primary-hover": "#F43F5E",
      "--app-accent": "#A855F7",
      "--app-success": "#22C55E",
      "--app-border": "#E9D5CA",
      "--app-ring": "#FBCFE8",
      "--app-danger": "#DC2626",
      "--app-warning": "#F97316"
    }
  },
  {
    slug: "dark-luxury",
    name: "Dark Luxury",
    description: "Un tema sofisticado y oscuro con detalles dorados, azul vivo y tipografía clara.",
    recommendedUsage: "Perfecto para dashboards premium, negocios boutique y marcas que requieren un estilo elegante.",
    colors: {
      background: "#0B1120",
      surface: "#1E293B",
      surfaceMuted: "#111827",
      text: "#F8FAFC",
      textMuted: "#CBD5E1",
      primary: "#3B82F6",
      primaryHover: "#2563EB",
      accent: "#D4AF37",
      success: "#22C55E",
      border: "#334155",
      ring: "#93C5FD",
      danger: "#F87171",
      warning: "#FBBF24"
    },
    preview: ["#0B1120", "#1E293B", "#D4AF37", "#3B82F6", "#F8FAFC"],
    cssVariables: {
      "--app-bg": "#0B1120",
      "--app-surface": "#1E293B",
      "--app-surface-muted": "#111827",
      "--app-text": "#F8FAFC",
      "--app-text-muted": "#CBD5E1",
      "--app-primary": "#3B82F6",
      "--app-primary-hover": "#2563EB",
      "--app-accent": "#D4AF37",
      "--app-success": "#22C55E",
      "--app-border": "#334155",
      "--app-ring": "#93C5FD",
      "--app-danger": "#F87171",
      "--app-warning": "#FBBF24"
    }
  }
];
