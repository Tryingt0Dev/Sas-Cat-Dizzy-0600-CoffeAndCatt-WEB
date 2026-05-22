import { DashboardNav } from "@/components/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-gray-50 lg:grid-cols-[280px_1fr]">
      <DashboardNav />
      <section className="min-w-0 p-5 lg:p-8">{children}</section>
    </main>
  );
}
