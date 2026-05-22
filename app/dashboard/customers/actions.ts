"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { customerUpdateSchema } from "@/lib/validation";
import { assertTenantCustomer, TenantAccessError } from "@/services/tenant-guard";

export async function updateCustomerAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const parsed = customerUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    status: formData.get("status"),
    leadScore: formData.get("leadScore") || 0,
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) redirect("/dashboard/customers?error=Revisa los datos del cliente");

  try {
    await assertTenantCustomer(business.id, parsed.data.id);
    await prisma.customer.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        status: parsed.data.status,
        leadScore: parsed.data.leadScore,
        notes: parsed.data.notes
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/customers?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${parsed.data.id}`);
  redirect(`/dashboard/customers/${parsed.data.id}?success=Cliente actualizado`);
}
