"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/Input";
import { evaluatePasswordPolicy } from "@/lib/password-policy";

export function RegisterCredentialsFields() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const checks = useMemo(() => evaluatePasswordPolicy(password, email), [email, password]);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  return (
    <>
      <label className="block text-sm font-semibold text-gray-900">
        Correo
        <span className="mt-1 block text-xs text-gray-500">Usaremos este correo como acceso único a tu cuenta.</span>
        <Input
          name="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-900">
            Contraseña
            <span className="mt-1 block text-xs text-gray-500">Crea una contraseña fuerte para proteger tu tienda.</span>
            <div className="relative mt-2">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 10 caracteres"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-24"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-100"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <label className="block text-sm font-semibold text-gray-900">
            Confirmar contraseña
            <span className="mt-1 block text-xs text-gray-500">Repite la contraseña para evitar errores de escritura.</span>
            <Input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className={check.valid ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-gray-300"} />
              {check.label}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span className={passwordsMatch ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-gray-300"} />
            Confirmación coincide
          </div>
        </div>
      </div>
    </>
  );
}
