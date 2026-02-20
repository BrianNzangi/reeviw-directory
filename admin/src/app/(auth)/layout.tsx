import { getMeServer } from "@/lib/me";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const me = await getMeServer();
  if (me?.user) {
    redirect("/dashboard");
  }
  return children;
}
