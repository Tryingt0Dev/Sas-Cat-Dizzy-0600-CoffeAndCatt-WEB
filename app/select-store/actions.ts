"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELECTED_BUSINESS_COOKIE } from "@/lib/auth";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/dashboard");
  return next.startsWith("/dashboard") ? next : "/dashboard";
}

export async function selectStoreAction(formData: FormData) {
  const businessId = String(formData.get("businessId") || "").trim();
  if (!businessId) redirect("/select-store?error=Tienda invalida");

  try {
    await getStoreAccess({ businessId, permission: "view_dashboard" });
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof AuthorizationError) redirect("/select-store?error=No tienes acceso a esa tienda");
    throw error;
  }
  const ck = await cookies();
  ck.set(SELECTED_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });

  redirect(safeNext(formData.get("next")));
}
