import { getCurrentPlatformAdminAccess } from "@/lib/platform-admin";
import { FloatingPlatformAdminButton } from "@/components/FloatingPlatformAdminButton";

export default async function FloatingPlatformAdminGate() {
  const current = await getCurrentPlatformAdminAccess();
  if (!current?.access.enabled) return null;
  return <FloatingPlatformAdminButton role={current.access.role} />;
}
