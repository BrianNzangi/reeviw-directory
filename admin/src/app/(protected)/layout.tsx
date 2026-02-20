import { requireMe } from "@/lib/me";
import { AdminShell } from "@/components/layout/admin-shell";
import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const me = await requireMe();
  return <AdminShell me={me}>{children}</AdminShell>;
}
