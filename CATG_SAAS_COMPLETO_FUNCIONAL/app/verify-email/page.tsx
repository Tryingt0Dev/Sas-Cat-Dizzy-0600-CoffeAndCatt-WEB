import { auditSuccess, auditFailure } from "@/lib/audit-log";
import { verifyEmailToken } from "@/lib/auth/email-verification";
import Link from "next/link";
import { Card } from "@/components/Card";

async function VerifyEmailContent({ token }: { token?: string }) {
  if (!token) {
    return (
      <Card className="max-w-md">
        <h1 className="text-2xl font-bold text-red-600">Token no válido</h1>
        <p className="mt-2 text-sm text-gray-600">El enlace de verificación no contiene un token válido.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white">
          Volver al login
        </Link>
      </Card>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    await auditFailure({ action: "email_verification_failed", resourceType: "EmailVerificationToken", metadata: { reason: result.reason || "invalid" } });
    return (
      <Card className="max-w-md">
        <h1 className="text-2xl font-bold text-red-600">Verificación fallida</h1>
        <p className="mt-2 text-sm text-gray-600">El enlace ha expirado o no es válido. Si el correo es correcto, solicita un nuevo enlace.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/verify-email-prompt" className="rounded-lg bg-blue-600 px-4 py-2 text-center text-white">
            Reenviar verificación
          </Link>
          <Link href="/login" className="rounded-lg bg-gray-200 px-4 py-2 text-center text-gray-800">
            Volver al login
          </Link>
        </div>
      </Card>
    );
  }

  await auditSuccess({ action: "email_verified", resourceType: "EmailVerificationToken", metadata: { status: "verified" } });
  return (
    <Card className="max-w-md">
      <h1 className="text-2xl font-bold text-green-600">¡Verificación exitosa!</h1>
      <p className="mt-2 text-sm text-gray-600">Tu correo ha sido verificado correctamente. Ahora puedes acceder a tu cuenta.</p>
      <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-white">
        Ir al dashboard
      </Link>
    </Card>
  );
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]> | undefined> }) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <VerifyEmailContent token={token} />
    </div>
  );
}

