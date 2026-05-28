"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELECTED_BUSINESS_COOKIE } from "@/lib/auth";
import { auditBlocked, auditSuccess } from "@/services/audit-log";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/dashboard");
  return next.startsWith("/dashboard") ? next : "/dashboard";
}

export async function selectStoreAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "").trim();
  if (!businessId) {
    await auditBlocked({
      action: "select_store_blocked",
      entityType: "Business",
      metadata: { reason: "missing_business_id" }
    });
    redirect("/select-store?error=Tienda invalida");
  }

  let access: Awaited<ReturnType<typeof getStoreAccess>>;
  try {
    access = await getStoreAccess({ businessId, permission: "view_dashboard", requireExplicitBusiness: true });
  } catch (error) {
    await auditBlocked({
      action: "select_store_blocked",
      entityType: "Business",
      metadata: { reason: error instanceof AuthenticationError ? "authentication_required" : "authorization_failed" }
    });
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof AuthorizationError) redirect("/select-store?error=No tienes acceso a esa tienda");
    throw error;
  }
  const ck = await cookies();
  ck.set(SELECTED_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });

  await auditSuccess({
    userId: access.user.id,
    businessId: access.business.id,
    action: "select_store_success",
    entityType: "Business",
    entityId: access.business.id
  });

  redirect(safeNext(formData.get("next")));
}
