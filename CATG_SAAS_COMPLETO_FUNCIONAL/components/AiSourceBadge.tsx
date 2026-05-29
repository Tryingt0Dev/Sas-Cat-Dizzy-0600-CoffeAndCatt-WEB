import {
  getAiSourceLabel,
  normalizeAiSources,
  type AiSource
} from "@/lib/ai-sources";

export function AiSourceBadge({ 
  source,
  compact = false 
}: { 
  source: AiSource;
  compact?: boolean;
}) {
  const label = source.label || getAiSourceLabel(source.type);

  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-3 py-1 text-xs font-semibold text-[var(--catalog-text)] ${
      compact ? "px-2" : ""
    }`}>
      <span className="shrink-0">{label}</span>
      {source.title && (
        <span className="truncate text-[var(--catalog-text-muted)]">: {source.title}</span>
      )}
    </span>
  );
}

export function AiSourcesList({ 
  sources,
  compact = false 
}: { 
  sources: unknown;
  compact?: boolean;
}) {
  const validSources = normalizeAiSources(sources);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-semibold text-[var(--catalog-text-muted)]">
        La IA usó información disponible de tu tienda.
      </p>
      <div className={`flex flex-wrap gap-2 ${compact ? "gap-1" : ""}`}>
        {validSources.map((source, index) => (
          <AiSourceBadge key={`${source.type}-${source.id ?? source.title ?? index}`} source={source} compact={compact} />
        ))}
      </div>
    </div>
  );
}
