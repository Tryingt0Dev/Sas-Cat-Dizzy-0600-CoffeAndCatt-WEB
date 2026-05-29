import { getAttributeLabels } from "@/lib/store-types";

export function ProductAttributeDisplay({
  attributes,
  businessType,
  maxVisible = 3,
  layout = "grid"
}: {
  attributes?: Record<string, unknown>;
  businessType?: string | null;
  maxVisible?: number;
  layout?: "grid" | "list" | "inline";
}) {
  if (!attributes || Object.keys(attributes).length === 0) return null;

  const fields = getAttributeLabels(businessType);
  const fieldMap = new Map(fields.map((f) => [f.key, f]));

  const entries = Object.entries(attributes)
    .map(([key, value]) => ({
      key,
      value: String(value ?? "").trim(),
      field: fieldMap.get(key)
    }))
    .filter(({ value }) => value !== "" && value !== "false" && value !== "null")
    .slice(0, maxVisible);

  if (entries.length === 0) return null;

  const baseClasses = "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 text-xs font-medium";

  if (layout === "list") {
    return (
      <div className="space-y-2">
        {entries.map(({ key, value, field }) => {
          const label = field?.label || key;
          const isBoolean = field?.type === "boolean";
          const isBooleanTrue = isBoolean && (value === "true" || value === "1" || value === "on");

          if (isBoolean && !isBooleanTrue) return null;

          return (
            <div key={key} className="flex flex-col gap-1 border-b border-gray-100 pb-2 last:border-0">
              <span className="font-bold text-gray-700 text-sm">{label}</span>
              {!isBoolean && <span className="text-gray-600 text-sm">{value}</span>}
              {isBoolean && isBooleanTrue && <span className="text-green-600 text-sm font-semibold">✓ Disponible</span>}
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(({ key, value, field }) => {
          const label = field?.label || key;
          const isBoolean = field?.type === "boolean";
          const isBooleanTrue = isBoolean && (value === "true" || value === "1" || value === "on");

          if (isBoolean && !isBooleanTrue) return null;

          return (
            <div key={key} className={baseClasses}>
              <span className="text-gray-700">{label}</span>
              {!isBoolean && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{value}</span>
                </>
              )}
              {isBoolean && isBooleanTrue && <span className="text-green-600">✓</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Default: grid
  return (
    <div className="mt-3 grid gap-2">
      {entries.map(({ key, value, field }) => {
        const label = field?.label || key;
        const isBoolean = field?.type === "boolean";
        const isBooleanTrue = isBoolean && (value === "true" || value === "1" || value === "on");

        if (isBoolean && !isBooleanTrue) return null;

        return (
          <div key={key} className={baseClasses}>
            <span className="text-gray-700">{label}</span>
            {!isBoolean && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{value}</span>
              </>
            )}
            {isBoolean && isBooleanTrue && <span className="text-green-600">✓</span>}
          </div>
        );
      })}
    </div>
  );
}
