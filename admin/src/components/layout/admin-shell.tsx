"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { canAccessUserAdmin, hasPermission, type AdminMe } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NavItem = { href: string; label: string; show: boolean };

export function AdminShell({ me, children }: { me: AdminMe; children: ReactNode }) {
  const pathname = usePathname();

  const contentItems: NavItem[] = [
    { href: "/posts", label: "Posts", show: hasPermission(me.permissions, "manage_posts") },
    { href: "/tools", label: "Tools", show: hasPermission(me.permissions, "manage_tools") },
    { href: "/categories", label: "Categories", show: hasPermission(me.permissions, "manage_categories") },
    { href: "/comparisons", label: "Comparisons", show: hasPermission(me.permissions, "manage_comparisons") },
    { href: "/reviews", label: "Reviews", show: hasPermission(me.permissions, "moderate_reviews") },
  ];

  const monetizationItems: NavItem[] = [
    { href: "/affiliates/programs", label: "Affiliate Programs", show: hasPermission(me.permissions, "manage_affiliates") },
    { href: "/affiliates/links", label: "Affiliate Links", show: hasPermission(me.permissions, "manage_affiliates") },
  ];

  const accessItems: NavItem[] = [
    { href: "/users", label: "Users", show: canAccessUserAdmin(me) },
    { href: "/rbac", label: "RBAC", show: canAccessUserAdmin(me) },
  ];

  async function handleLogout() {
    await authClient.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-card p-4">
          <div className="mb-6">
            <div className="text-sm uppercase tracking-wide text-slate-500">Reeviw</div>
            <div className="text-lg font-semibold">Admin</div>
          </div>
          <SidebarGroup title="Content" items={contentItems} pathname={pathname} />
          <SidebarGroup title="Monetization" items={monetizationItems} pathname={pathname} />
          <SidebarGroup title="Access" items={accessItems} pathname={pathname} />
        </aside>
        <div>
          <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <h1 className="text-lg font-semibold">CMS</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">{me.user?.email || "user"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  const visible = items.filter((item) => item.show);
  if (visible.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <nav className="space-y-1">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-2 py-1.5 text-sm ${active ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
