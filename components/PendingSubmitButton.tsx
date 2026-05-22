"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  pendingText = "Guardando...",
  className
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
