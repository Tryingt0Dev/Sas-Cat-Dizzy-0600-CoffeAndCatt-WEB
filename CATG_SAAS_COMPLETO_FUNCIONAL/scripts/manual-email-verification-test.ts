import { prisma } from "@/lib/db";
import { createEmailVerificationToken, verifyEmailToken } from "@/lib/auth/email-verification";
import sendEmail from "@/lib/email";

async function main() {
  const testEmail = `manual-verification-test+${Date.now()}@example.com`;
  const testName = "Test Usuario";
  console.log("Test email:", testEmail);

  await prisma.user.deleteMany({ where: { email: testEmail } });

  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: testName,
      passwordHash: "test-password-hash",
      role: "USER"
    }
  });

  console.log("Created user id:", user.id);

  const tokenData = await createEmailVerificationToken(user.id, "127.0.0.1");
  console.log("Generated token:", tokenData.token);

  const verificationResult = await verifyEmailToken(tokenData.token);
  console.log("Verification result:", verificationResult);

  const userAfter = await prisma.user.findUnique({ where: { id: user.id } });
  console.log("User after verification emailVerifiedAt:", userAfter?.emailVerifiedAt?.toISOString());

  const verificationResultAgain = await verifyEmailToken(tokenData.token);
  console.log("Verification result when reused:", verificationResultAgain);

  const sendResult = await sendEmail({
    to: testEmail,
    verificationUrl: `http://localhost:3000/verify-email?token=${encodeURIComponent(tokenData.token)}`
  });
  console.log("Send email result:", sendResult);

  await prisma.user.deleteMany({ where: { id: user.id } });
  console.log("Cleanup complete");
}

main()
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
