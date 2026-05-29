"use client";

import { useMemo, useState } from "react";

interface PasswordCheck {
  key: string;
  label: string;
  valid: boolean;
}

function getPasswordChecks(password: string, confirmPassword: string, email: string): PasswordCheck[] {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim().toLowerCase();

  return [
    { key: "length", label: "Mínimo 10 caracteres", valid: password.length >= 10 },
    { key: "uppercase", label: "Una letra mayúscula", valid: /[A-Z]/.test(password) },
    { key: "lowercase", label: "Una letra minúscula", valid: /[a-z]/.test(password) },
    { key: "number", label: "Un número", valid: /\d/.test(password) },
    { key: "symbol", label: "Un símbolo", valid: /[^A-Za-z0-9]/.test(password) },
    { key: "trim", label: "Sin espacios al inicio o final", valid: password.length > 0 && password === password.trim() },
    { key: "not-email", label: "Distinta a tu correo", valid: !normalizedEmail || normalizedPassword !== normalizedEmail },
    { key: "match", label: "Confirmación coincide", valid: confirmPassword.length > 0 && password === confirmPassword },
  ];
}

const inputClass =
  "mt-1.5 block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10";

const toggleBtnClass =
  "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-100 select-none";

export function RegisterFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checks = useMemo(
    () => getPasswordChecks(password, confirmPassword, email),
    [email, password, confirmPassword],
  );

  return (
    <>
      {/* Nombre */}
      <label className="block text-sm font-semibold text-gray-900">
        Tu nombre
        <span className="mt-1 block text-xs text-gray-500">Nombre de la persona que administrará la tienda.</span>
        <input
          name="name"
          placeholder="Tu nombre"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>

      {/* Correo */}
      <label className="block text-sm font-semibold text-gray-900">
        Correo
        <span className="mt-1 block text-xs text-gray-500">Usaremos este correo como acceso único a tu cuenta.</span>
        <input
          name="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      {/* Bloque de contraseñas */}
      <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contraseña */}
          <label className="block text-sm font-semibold text-gray-900">
            Contraseña
            <span className="mt-1 block text-xs text-gray-500">Crea una contraseña fuerte para proteger tu tienda.</span>
            <div className="relative mt-2">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 10 caracteres"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-24`}
              />
              <button
                type="button"
                className={toggleBtnClass}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          {/* Confirmar contraseña */}
          <label className="block text-sm font-semibold text-gray-900">
            Confirmar contraseña
            <span className="mt-1 block text-xs text-gray-500">Repite la contraseña para evitar errores de escritura.</span>
            <div className="relative mt-2">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} pr-24`}
              />
              <button
                type="button"
                className={toggleBtnClass}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>
        </div>

        {/* Requisitos de contraseña en tiempo real */}
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  check.valid ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
              <span className={check.valid ? "text-emerald-700" : "text-gray-600"}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nombre de la tienda */}
      <label className="block text-sm font-semibold text-gray-900">
        Nombre de la tienda
        <span className="mt-1 block text-xs text-gray-500">Nombre público que verán tus clientes.</span>
        <input
          name="businessName"
          placeholder="Nombre de la tienda"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={inputClass}
        />
      </label>

      {/* Tipo de tienda */}
      <label className="md:col-span-2 block text-sm font-semibold text-gray-900">
        Tipo de tienda
        <span className="mt-1 block text-xs text-gray-500">Selecciona el giro que mejor describe tu negocio.</span>
        <select
          name="businessType"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className={inputClass}
        >
          <option value="">Elige un tipo de tienda</option>
          <option value="FASHION">Ropa y moda</option>
          <option value="MARKETPLACE">Tienda general / Marketplace</option>
          <option value="SECURITY">Cámaras y seguridad</option>
          <option value="SPORTS">Deportes</option>
          <option value="TECHNOLOGY">Tecnología</option>
          <option value="FOOD">Comida / Restaurante</option>
          <option value="BEAUTY">Belleza / Cosmética</option>
          <option value="HARDWARE">Ferretería / Construcción</option>
          <option value="SERVICES">Servicios</option>
          <option value="OTHER">Otro / Personalizado</option>
        </select>
      </label>
    </>
  );
}
