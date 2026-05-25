export type CatalogPalette = {
  slug: string;
  name: string;
  description: string;
  idealFor: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    banner: string;
    price: string;
    discount: string;
    success: string;
    muted: string;
  };
  preview: string[];
};

export const catalogPalettes: CatalogPalette[] = [
  {
    slug: "moda-rosa",
    name: "Moda Rosa",
    description: "Un aire femenino, suave y moderno para marcas de moda, belleza y accesorios.",
    idealFor: "Tiendas de ropa, accesorios y belleza.",
    colors: {
      primary: "#E91E63",
      secondary: "#F48FB1",
      accent: "#880E4F",
      background: "#FFF5F7",
      surface: "#FFFFFF",
      text: "#1F2937",
      textMuted: "#6B7280",
      border: "#FBCFE8",
      banner: "#F8BBD0",
      price: "#B91C1C",
      discount: "#B45309",
      success: "#22C55E",
      muted: "#FCE7F3"
    },
    preview: ["#F8BBD0", "#F48FB1", "#E91E63", "#880E4F", "#FFF5F7"]
  },
  {
    slug: "tech-azul",
    name: "Tech Azul",
    description: "Líneas limpias y tonos metálicos para tiendas de electrónica, gadgets y tecnología.",
    idealFor: "Electrónica, tecnología y gadgets.",
    colors: {
      primary: "#0D47A1",
      secondary: "#1976D2",
      accent: "#42A5F5",
      background: "#E3F2FD",
      surface: "#FFFFFF",
      text: "#263238",
      textMuted: "#475569",
      border: "#BBDEFB",
      banner: "#DDEEFF",
      price: "#0A4B91",
      discount: "#0F766E",
      success: "#22C55E",
      muted: "#DBEAFE"
    },
    preview: ["#0D47A1", "#1976D2", "#42A5F5", "#E3F2FD", "#263238"]
  },
  {
    slug: "natural-verde",
    name: "Natural Verde",
    description: "Tonality natural, fresca y confiable para tiendas de salud, orgánicos y bienestar.",
    idealFor: "Productos naturales, salud y bienestar.",
    colors: {
      primary: "#388E3C",
      secondary: "#66BB6A",
      accent: "#A5D6A7",
      background: "#E8F5E9",
      surface: "#FFFFFF",
      text: "#2F3E28",
      textMuted: "#515B40",
      border: "#C8E6C9",
      banner: "#DFF5E2",
      price: "#1F7A21",
      discount: "#7C2D12",
      success: "#22C55E",
      muted: "#F0F7EE"
    },
    preview: ["#A5D6A7", "#66BB6A", "#388E3C", "#E8F5E9", "#795548"]
  },
  {
    slug: "premium-negro-dorado",
    name: "Premium Negro & Dorado",
    description: "Un estilo sofisticado y premium con contrastes profundos y toques dorados.",
    idealFor: "Joyería, relojes y productos premium.",
    colors: {
      primary: "#111111",
      secondary: "#1F1F1F",
      accent: "#D4AF37",
      background: "#FFFFFF",
      surface: "#F5E6B3",
      text: "#111111",
      textMuted: "#4B5563",
      border: "#E8D8A7",
      banner: "#F5E6B3",
      price: "#111111",
      discount: "#B45309",
      success: "#22C55E",
      muted: "#F8F1DD"
    },
    preview: ["#111111", "#1F1F1F", "#D4AF37", "#F5E6B3", "#FFFFFF"]
  },
  {
    slug: "minimal-arena",
    name: "Minimal Arena",
    description: "Un espacio limpio y neutro con matices cálidos y una sensación minimalista.",
    idealFor: "Hogar, decoración y lifestyle minimalista.",
    colors: {
      primary: "#8D8D8D",
      secondary: "#D6C9B6",
      accent: "#2B2B2B",
      background: "#F5F2EE",
      surface: "#FFFFFF",
      text: "#2B2B2B",
      textMuted: "#6B7280",
      border: "#E7E1D9",
      banner: "#FAF7F2",
      price: "#2B2B2B",
      discount: "#7C2D12",
      success: "#22C55E",
      muted: "#F8F5F0"
    },
    preview: ["#F5F2EE", "#E7E1D9", "#D6C9B6", "#8D8D8D", "#2B2B2B"]
  },
  {
    slug: "kids-pop",
    name: "Kids Pop",
    description: "Un look alegre y energético con colores vibrantes y un estilo juguetón.",
    idealFor: "Tiendas infantiles, juguetes y escolares.",
    colors: {
      primary: "#FF6B6B",
      secondary: "#FFD93D",
      accent: "#7C4DFF",
      background: "#FFFFFF",
      surface: "#FFF5F5",
      text: "#1F2937",
      textMuted: "#475569",
      border: "#FFE4E4",
      banner: "#FFEDEB",
      price: "#B91C1C",
      discount: "#F97316",
      success: "#22C55E",
      muted: "#FEF3C7"
    },
    preview: ["#FF6B6B", "#FFA726", "#FFD93D", "#4CAF50", "#7C4DFF"]
  },
  {
    slug: "lila-boutique",
    name: "Lila Boutique",
    description: "Romántico y elegante con lavandas, morados profundos y un toque delicado.",
    idealFor: "Papelería, accesorios, cosmética y regalos.",
    colors: {
      primary: "#9333EA",
      secondary: "#C084FC",
      accent: "#4C1D95",
      background: "#FAF5FF",
      surface: "#FFFFFF",
      text: "#1F2937",
      textMuted: "#6B7280",
      border: "#E9D5FF",
      banner: "#F3EBFF",
      price: "#6D28D9",
      discount: "#BE185D",
      success: "#22C55E",
      muted: "#F5E8FF"
    },
    preview: ["#E9D5FF", "#C084FC", "#9333EA", "#4C1D95", "#FAF5FF"]
  },
  {
    slug: "citrico-naranja",
    name: "Cítrico Naranja",
    description: "Una paleta dinámica y cálida para tiendas con energía y movimiento.",
    idealFor: "Food delivery, snacks, cocina y tiendas dinámicas.",
    colors: {
      primary: "#F97316",
      secondary: "#FDBA74",
      accent: "#EA580C",
      background: "#FFF7ED",
      surface: "#FFFFFF",
      text: "#7C2D12",
      textMuted: "#5B4636",
      border: "#FCD7A0",
      banner: "#FFF1E0",
      price: "#C2410C",
      discount: "#B45309",
      success: "#22C55E",
      muted: "#FFF4E1"
    },
    preview: ["#FFF7ED", "#FDBA74", "#F97316", "#EA580C", "#7C2D12"]
  },
  {
    slug: "oceano-calmado",
    name: "Océano Calmado",
    description: "Relajante y moderno con azules suaves y contrastes profundos.",
    idealFor: "Hogar, bienestar, tiendas generales y productos funcionales.",
    colors: {
      primary: "#0EA5E9",
      secondary: "#93C5FD",
      accent: "#0369A1",
      background: "#DBEAFE",
      surface: "#FFFFFF",
      text: "#082F49",
      textMuted: "#475569",
      border: "#BFDBFE",
      banner: "#DFF4FF",
      price: "#0B5FA8",
      discount: "#0F766E",
      success: "#22C55E",
      muted: "#EAF4FF"
    },
    preview: ["#DBEAFE", "#93C5FD", "#0EA5E9", "#0369A1", "#082F49"]
  },
  {
    slug: "tierra-artesanal",
    name: "Tierra Artesanal",
    description: "Texturas cálidas y materias naturales para productos hechos a mano.",
    idealFor: "Manualidades, decoración, cuero, café y productos hechos a mano.",
    colors: {
      primary: "#B45309",
      secondary: "#D6BFA7",
      accent: "#7C2D12",
      background: "#FAE8D5",
      surface: "#FFFFFF",
      text: "#3D2C1A",
      textMuted: "#5C4938",
      border: "#E8D2C1",
      banner: "#F7E5D1",
      price: "#7C2D12",
      discount: "#A04000",
      success: "#22C55E",
      muted: "#F8FAFC"
    },
    preview: ["#FAE8D5", "#D6BFA7", "#B45309", "#7C2D12", "#F8FAFC"]
  },
  {
    slug: "pastel-sweet",
    name: "Pastel Sweet",
    description: "Una paleta delicada, juvenil y alegre para tiendas dulces y regalos personalizados.",
    idealFor: "Repostería, regalos, productos personalizados y tiendas juveniles.",
    colors: {
      primary: "#F9A8D4",
      secondary: "#FDE68A",
      accent: "#93C5FD",
      background: "#FCE7F3",
      surface: "#FFFFFF",
      text: "#3F3F46",
      textMuted: "#6B7280",
      border: "#FAD8F0",
      banner: "#FFF1F8",
      price: "#BE185D",
      discount: "#EA580C",
      success: "#22C55E",
      muted: "#FEF3C7"
    },
    preview: ["#FCE7F3", "#F9A8D4", "#FDE68A", "#86EFAC", "#93C5FD"]
  }
];
