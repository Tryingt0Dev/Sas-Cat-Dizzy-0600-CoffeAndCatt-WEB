"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Input, Select } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import type { PlatformAdminRole } from "@/lib/platform-admin";
import {
  grantPlatformAccessToExistingUser,
  searchUsersForPlatformAccess,
  type PlatformAccessUserResult
} from "./actions";

const PLATFORM_ACCESS_ROLES = ["OWNER", "ADMIN", "SUPPORT", "BILLING"] as const;

function accessLabel(result: PlatformAccessUserResult) {
  if (!result.access) return "Sin acceso global";
  if (!result.access.enabled) return "Acceso desactivado";
  return result.access.source === "database" ? "Ya tiene acceso global" : "Acceso por configuración";
}

export function PlatformAccessUserPicker({
  canGrantAccess,
  canGrantOwner
}: {
  canGrantAccess: boolean;
  canGrantOwner: boolean;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<PlatformAdminRole>(canGrantOwner ? "OWNER" : "ADMIN");
  const [results, setResults] = useState<PlatformAccessUserResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [isGranting, startGrant] = useTransition();
  const availableRoles = useMemo(() => PLATFORM_ACCESS_ROLES.filter((item) => canGrantOwner || item !== "OWNER"), [canGrantOwner]);

  useEffect(() => {
    if (!availableRoles.includes(role)) setRole("ADMIN");
  }, [availableRoles, role]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setMessage("");
      return;
    }

    const timer = window.setTimeout(() => {
      startSearch(async () => {
        try {
          const nextResults = await searchUsersForPlatformAccess(term);
          setResults(nextResults);
          setMessage(nextResults.length === 0 ? "No encontramos usuarios registrados con esa búsqueda." : "");
        } catch {
          setMessage("No se pudo buscar usuarios en este momento.");
        }
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="mb-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black">Agregar acceso desde usuario existente</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            Busca un usuario registrado y elévalo sin escribir el correo manualmente.
          </p>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por email, nombre o ID"
            className="mt-2 py-2 text-sm"
            aria-label="Buscar usuarios registrados"
            disabled={!canGrantAccess}
          />
        </div>
        <div className="w-full lg:w-44">
          <label className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]" htmlFor="platform-access-role">
            Rol
          </label>
          <Select
            id="platform-access-role"
            value={role}
            onChange={(event) => setRole(event.target.value as PlatformAdminRole)}
            className="mt-2 py-2 text-sm"
            disabled={!canGrantAccess}
          >
            {availableRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isSearching ? <p className="mt-3 text-xs font-bold text-[var(--app-text-muted)]">Buscando usuarios...</p> : null}
      {message ? <p className="mt-3 rounded-xl bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text-muted)]">{message}</p> : null}

      {results.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {results.map((result) => {
            const canGrantResult = canGrantAccess && (!result.access || !result.access.enabled || result.access.source === "database");
            return (
              <div key={result.id} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{result.name}</p>
                    <p className="truncate text-xs text-[var(--app-text-muted)]">{result.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusBadge variant={result.access?.enabled ? "success" : result.access ? "warning" : "neutral"} className="px-2 py-0.5 text-[0.68rem]">
                        {accessLabel(result)}
                      </StatusBadge>
                      {result.access ? (
                        <StatusBadge variant="dark" className="px-2 py-0.5 text-[0.68rem]">
                          {result.access.role}
                        </StatusBadge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[0.68rem] font-bold text-[var(--app-text-muted)]">
                      {result.stores.length > 0 ? (
                        result.stores.map((store) => (
                          <span key={`${result.id}-${store.slug}`} className="rounded-full bg-[var(--app-surface-muted)] px-2 py-1">
                            {store.role}: {store.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-1">Sin tiendas asociadas</span>
                      )}
                    </div>
                  </div>
                  {result.access?.enabled ? (
                    <a href="#accesos" className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-center text-xs font-black">
                      Editar acceso
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canGrantResult || isGranting}
                      onClick={() => {
                        startGrant(async () => {
                          await grantPlatformAccessToExistingUser(result.id, role);
                        });
                      }}
                    >
                      {result.access ? "Reactivar acceso" : "Elevar a admin global"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
