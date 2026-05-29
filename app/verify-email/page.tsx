import { auditSuccess, auditFailure } from "@/lib/audit-log";
import { verifyEmailToken } from "@/lib/auth/email-verification";
import Link from "next/link";
import { EmailVerifiedSignal } from "./EmailVerifiedSignal";

async function VerifyEmailContent({ token }: { token?: string }) {
  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-900">
        <h1 className="text-2xl font-bold text-red-600">Token no valido</h1>
        <p className="mt-2 text-sm text-gray-600">El enlace de verificacion no contiene un token valido.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white">
          Volver al login
        </Link>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    await auditFailure({ action: "email_verification_failed", resourceType: "EmailVerificationToken", metadata: { reason: result.reason || "invalid" } });
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-900">
        <h1 className="text-2xl font-bold text-red-600">Verificacion fallida</h1>
        <p className="mt-2 text-sm text-gray-600">El enlace ha expirado o no es valido. Si el correo es correcto, solicita un nuevo enlace.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/verify-email-prompt" className="rounded-lg bg-blue-600 px-4 py-2 text-center text-white">
            Reenviar verificacion
          </Link>
          <Link href="/login" className="rounded-lg bg-gray-200 px-4 py-2 text-center text-gray-800">
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  await auditSuccess({ action: "email_verified", resourceType: "EmailVerificationToken", metadata: { status: "verified" } });

  return <EmailVerifiedSignal />;
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
