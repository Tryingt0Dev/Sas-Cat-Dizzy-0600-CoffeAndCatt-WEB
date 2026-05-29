export type AiSourceType = "product" | "category" | "store_config" | "catalog" | "assistant";

export type AiSource = {
  id?: string;
  type: AiSourceType;
  label: string;
  title?: string;
  storeId?: string;
};

const SOURCE_LABELS: Record<AiSourceType, string> = {
  product: "Producto",
  category: "Categoria",
  store_config: "Configuracion de tienda",
  catalog: "Catalogo",
  assistant: "Asistente CATG"
};

const SOURCE_TYPES = new Set<AiSourceType>(["product", "category", "store_config", "catalog", "assistant"]);

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (
    lower === "unknown" ||
    lower === "unknown origin" ||
    lower === "origen desconocido" ||
    lower === "source.origin" ||
    lower === "null" ||
    lower === "undefined"
  ) {
    return undefined;
  }
  return trimmed;
}

function normalizeSourceType(value: unknown): AiSourceType | null {
  const raw = cleanText(value)?.toLowerCase().replace(/[-\s]/g, "_");
  if (!raw) return null;
  if (raw === "store" || raw === "settings" || raw === "store_settings" || raw === "config") return "store_config";
  if (raw === "products") return "product";
  if (raw === "categories") return "category";
  if (raw === "catalogue") return "catalog";
  return SOURCE_TYPES.has(raw as AiSourceType) ? (raw as AiSourceType) : null;
}

export function getAiSourceLabel(type: AiSourceType) {
  return SOURCE_LABELS[type];
}

export function normalizeAiSources(sources: unknown): AiSource[] {
  if (!Array.isArray(sources)) return [];

  return sources
    .map((source) => {
      if (typeof source === "string") {
        const title = cleanText(source);
        if (!title) return null;
        return {
          type: "assistant" as const,
          label: SOURCE_LABELS.assistant,
          title
        };
      }

      if (!source || typeof source !== "object") return null;
      const sourceRecord = source as Record<string, unknown>;
      const type =
        normalizeSourceType(sourceRecord.type) ??
        normalizeSourceType(sourceRecord.origin) ??
        normalizeSourceType(sourceRecord.source);

      if (!type) return null;

      const label = cleanText(sourceRecord.label) ?? SOURCE_LABELS[type];
      const title = cleanText(sourceRecord.title) ?? cleanText(sourceRecord.name);
      const id = cleanText(sourceRecord.id);
      const storeId = cleanText(sourceRecord.storeId);

      return {
        ...(id ? { id } : {}),
        type,
        label,
        ...(title ? { title } : {}),
        ...(storeId ? { storeId } : {})
      };
    })
    .filter((source): source is AiSource => Boolean(source));
}

export function hasUsefulAiSource(sources: unknown) {
  return normalizeAiSources(sources).length > 0;
}
