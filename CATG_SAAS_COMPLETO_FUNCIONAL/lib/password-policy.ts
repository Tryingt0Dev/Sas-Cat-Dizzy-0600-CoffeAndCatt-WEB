export type PasswordCheck = {
  key: string;
  label: string;
  valid: boolean;
};

const symbolPattern = /[^A-Za-z0-9]/;

export const passwordPolicyDescription =
  "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.";

export function evaluatePasswordPolicy(password: string, email?: string | null): PasswordCheck[] {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const normalizedPassword = password.trim().toLowerCase();

  return [
    { key: "length", label: "Mínimo 10 caracteres", valid: password.length >= 10 },
    { key: "uppercase", label: "Una letra mayúscula", valid: /[A-Z]/.test(password) },
    { key: "lowercase", label: "Una letra minúscula", valid: /[a-z]/.test(password) },
    { key: "number", label: "Un número", valid: /[0-9]/.test(password) },
    { key: "symbol", label: "Un símbolo", valid: symbolPattern.test(password) },
    { key: "trim", label: "Sin espacios al inicio o final", valid: password.length > 0 && password === password.trim() },
    {
      key: "not-email",
      label: "Distinta a tu correo",
      valid: !normalizedEmail || normalizedPassword !== normalizedEmail
    }
  ];
}

export function isStrongPassword(password: string, email?: string | null) {
  return evaluatePasswordPolicy(password, email).every((check) => check.valid);
}
