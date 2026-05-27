import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { requireStoreAccess } from "@/services/authorization";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await requireStoreAccess({ permission: "view_dashboard" });
  if (!access.user.themeOnboardingCompleted) {
    redirect("/onboarding/theme");
  }

  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1fr)] bg-[var(--app-bg)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <DashboardNav />
      <section className="min-w-0 p-5 sm:p-6 lg:p-6">{children}</section>
    </main>
  );
}
