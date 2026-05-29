import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ verified: false, error: "No autenticado" }, { status: 401 });
    }

    return NextResponse.json({
      verified: Boolean(user.emailVerifiedAt),
      onboardingCompleted: Boolean(user.themeOnboardingCompleted)
    });
  } catch (error) {
    console.error("Error checking email verification status:", error);
    return NextResponse.json({ verified: false, error: "Error interno" }, { status: 500 });
  }
}
