import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { requireStoreAccess } from "@/services/authorization";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await requireStoreAccess({ permission: "view_dashboard" });
  if (!access.user.themeOnboardingCompleted) {
    redirect("/onboarding/theme");
  }

  return (
    <main className="grid min-h-screen bg-[var(--app-bg)] lg:grid-cols-[280px_1fr]">
      <DashboardNav />
      <section className="min-w-0 p-5 lg:p-8">{children}</section>
    </main>
  );
}
