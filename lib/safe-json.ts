export type JsonRecord = Record<string, unknown>;

export function parseJsonSafely<T = unknown>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseJsonRecord(value: string | null | undefined): JsonRecord | null {
  const parsed = parseJsonSafely(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as JsonRecord;
}

export function parseStringRecord(value: string | null | undefined): Record<string, string> {
  const parsed = parseJsonRecord(value);
  if (!parsed) return {};
  return Object.fromEntries(
    Object.entries(parsed)
      .map(([key, entryValue]) => [key, entryValue == null ? "" : String(entryValue).trim()])
      .filter(([key]) => key.trim().length > 0)
  );
}

export function stringifyJsonSafely(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}
