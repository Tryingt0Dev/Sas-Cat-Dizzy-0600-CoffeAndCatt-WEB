import { HelpTooltip } from "@/components/HelpTooltip";
import { Input, Select, Textarea } from "@/components/Input";
import { ProductAttributeField } from "@/lib/store-types";

function getFieldValue(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function ProductAttributesFields({
  fields,
  currentAttributes = {}
}: {
  fields: ProductAttributeField[];
  currentAttributes?: Record<string, unknown>;
}) {
  const fieldKeys = new Set(fields.map((field) => field.key));
  const customEntries = Object.entries(currentAttributes)
    .filter(([key, value]) => !fieldKeys.has(key) && getFieldValue(value).trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right));
  const customRows = [...customEntries, ["", ""], ["", ""], ["", ""]];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-gray-900">Características del producto</h3>
            <p className="mt-1 text-sm text-gray-500">Completa la ficha técnica en lenguaje simple para que tus clientes entiendan mejor el producto.</p>
          </div>
          <HelpTooltip description="Estos campos se generan desde el tipo de negocio seleccionado. Si necesitas un dato extra, usa campos personalizados." />
        </div>
        {fields.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
            const value = getFieldValue(currentAttributes[field.key]);
            return (
              <label key={field.key} className="block text-sm font-semibold text-gray-900">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span>{field.label}</span>
                  {field.help ? <HelpTooltip description={field.help} /> : null}
                </div>
                {field.type === "textarea" ? (
                  <Textarea
                    name={`productAttributes[${field.key}]`}
                    defaultValue={value}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : field.type === "select" ? (
                  <Select name={`productAttributes[${field.key}]`} defaultValue={value || ""}>
                    <option value="">Seleccionar</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "boolean" ? (
                  <div className="flex items-center gap-3">
                    <input type="hidden" name={`productAttributes[${field.key}]`} value="false" />
                    <input
                      type="checkbox"
                      name={`productAttributes[${field.key}]`}
                      value="true"
                      defaultChecked={value === "true" || value === "1" || value === "on"}
                      className="h-5 w-5 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-600">Activar</span>
                  </div>
                ) : (
                  <Input
                    name={`productAttributes[${field.key}]`}
                    defaultValue={value}
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                  />
                )}
                {field.placeholder && field.type !== "boolean" ? (
                  <span className="mt-1 block text-xs text-gray-500">{field.placeholder}</span>
                ) : null}
              </label>
            );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            Selecciona un tipo de tienda en configuración para activar campos sugeridos. También puedes agregar datos personalizados abajo.
          </div>
        )}
      </div>

      <details className="rounded-3xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-gray-900">Campos personalizados</summary>
        <p className="mt-2 text-sm text-gray-500">Agrega datos extra como garantía, origen, compatibilidad, medidas especiales o material.</p>
        <div className="mt-4 grid gap-3">
          {customRows.map(([key, value], index) => (
            <div key={`${key}-${index}`} className="grid gap-3 md:grid-cols-[220px_1fr]">
              <Input name="customAttributeKey" defaultValue={key} placeholder="Nombre del campo" aria-label={`Nombre del campo personalizado ${index + 1}`} />
              <Input name="customAttributeValue" defaultValue={getFieldValue(value)} placeholder="Valor" aria-label={`Valor del campo personalizado ${index + 1}`} />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
