"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { hasPermission, isSuperadmin, type AdminMe } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  FileText,
  FolderTree,
  HelpCircle,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Link as LinkIcon,
  Package,
  Rocket,
  ScrollText,
  Shield,
  ShieldQuestion,
  Store,
  Clock,
  Settings2,
} from "lucide-react";

type NavItem = { href: string; label: string; show: boolean; icon: LucideIcon };
type GroupKey = "overview" | "content" | "pages" | "monetization" | "system";

export function AdminShell({ me, children }: { me: AdminMe; children: ReactNode }) {
  const pathname = usePathname();
  const canManageProducts = isSuperadmin(me.role) || hasPermission(me.permissions, "manage_products");
  const [sidebarDark, setSidebarDark] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("admin_sidebar_dark");
    if (stored) setSidebarDark(stored === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("admin_sidebar_dark", String(sidebarDark));
  }, [sidebarDark]);

  const primaryItems: NavItem[] = [{ href: "/dashboard", label: "Dashboard", show: true, icon: LayoutDashboard }];

  const contentItems: NavItem[] = [
    { href: "/posts", label: "Deal Blogs", show: hasPermission(me.permissions, "manage_posts"), icon: FileText },
    { href: "/products", label: "Products", show: canManageProducts, icon: Package },
    { href: "/categories", label: "Categories", show: hasPermission(me.permissions, "manage_categories"), icon: FolderTree },
    { href: "/reviews", label: "Reviews", show: hasPermission(me.permissions, "moderate_reviews"), icon: ShieldQuestion },
  ];

  const pageItems: NavItem[] = [
    { href: "/pages/about-bargainly-deals", label: "About Bargainly Deals", show: hasPermission(me.permissions, "manage_posts"), icon: Info },
    { href: "/pages/about-our-ads", label: "About our ads", show: hasPermission(me.permissions, "manage_posts"), icon: Briefcase },
    { href: "/pages/faq", label: "FAQ", show: hasPermission(me.permissions, "manage_posts"), icon: HelpCircle },
    { href: "/pages/support", label: "Support", show: hasPermission(me.permissions, "manage_posts"), icon: LifeBuoy },
    { href: "/pages/privacy-policy", label: "Privacy Policy", show: hasPermission(me.permissions, "manage_posts"), icon: Shield },
    { href: "/pages/terms", label: "Terms", show: hasPermission(me.permissions, "manage_posts"), icon: ScrollText },
    { href: "/pages/advertise", label: "Advertise", show: hasPermission(me.permissions, "manage_posts"), icon: BarChart3 },
  ];

  const monetizationItems: NavItem[] = [
    { href: "/merchants", label: "Merchants", show: canManageProducts, icon: Store },
    { href: "/merchants/analytics", label: "Merchant Analytics", show: canManageProducts, icon: BarChart3 },
    { href: "/affiliate-programs", label: "Affiliate Programs", show: hasPermission(me.permissions, "manage_affiliates"), icon: LinkIcon },
    { href: "/sync-logs", label: "Sync Logs", show: hasPermission(me.permissions, "manage_affiliates"), icon: ScrollText },
    { href: "/amazon/import", label: "Amazon Import", show: canManageProducts, icon: Package },
    { href: "/jobs", label: "Jobs", show: hasPermission(me.permissions, "manage_jobs"), icon: Rocket },
  ];

  const systemItems: NavItem[] = [
    { href: "/system/cronjobs", label: "Cron Jobs", show: hasPermission(me.permissions, "manage_jobs"), icon: Clock },
  ];

  const sidebarGroups = useMemo(
    () => [
      { key: "overview" as GroupKey, title: "Overview", items: primaryItems },
      { key: "content" as GroupKey, title: "Content", items: contentItems },
      { key: "pages" as GroupKey, title: "Pages", items: pageItems },
      { key: "monetization" as GroupKey, title: "Monetization", items: monetizationItems },
      { key: "system" as GroupKey, title: "System", items: systemItems },
    ],
    [primaryItems, contentItems, pageItems, monetizationItems, systemItems],
  );

  const activeGroup = useMemo(() => {
    for (const group of sidebarGroups) {
      const visible = group.items.filter((item) => item.show);
      if (visible.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        return group.key;
      }
    }
    return "overview" as GroupKey;
  }, [pathname, sidebarGroups]);

  const [openGroup, setOpenGroup] = useState<GroupKey | null>(activeGroup);

  useEffect(() => {
    setOpenGroup(activeGroup);
  }, [activeGroup]);

  async function handleLogout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const asideTone = sidebarDark ? "dark bg-[hsl(var(--brand-dark-9))] text-slate-100" : "bg-card text-slate-900";
  const groupTitleTone = sidebarDark ? "text-slate-300" : "text-slate-500";
  const linkTone = sidebarDark ? "text-slate-200 hover:bg-[hsl(var(--brand-dark-8))]" : "text-slate-700 hover:bg-muted";
  const activeLinkTone = sidebarDark ? "bg-[hsl(var(--brand-primary-1))] text-white" : "bg-muted text-slate-900";
  const brandTone = sidebarDark ? "text-slate-300" : "text-slate-500";
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <div className="h-screen overflow-hidden">
      <div className="grid h-full grid-cols-[260px_1fr]">
        <aside className={`border-r border-border p-4 h-screen overflow-hidden ${asideTone}`}>
          <div className="flex h-full flex-col">
            <div className="mb-12">
              <img
                src={sidebarDark ? "/secondary-logo.png" : "/primary-logo.png"}
                alt="Bargainly Deals Admin"
                className="h-12 w-auto"
              />
            </div>
            <div className="space-y-2">
              {sidebarGroups
                .filter((group) => group.key !== "system")
                .map((group) => (
                  <SidebarGroup
                    key={group.key}
                    title={group.title}
                    items={group.items}
                    pathname={pathname}
                    isOpen={openGroup === group.key}
                    isActive={activeGroup === group.key}
                    onToggle={() => {
                      setOpenGroup((prev) => (prev === group.key ? null : group.key));
                    }}
                    groupTitleClass={groupTitleTone}
                    linkClass={linkTone}
                    activeLinkClass={activeLinkTone}
                  />
                ))}
            </div>
            <div className="mt-4">
              {sidebarGroups
                .filter((group) => group.key === "system")
                .map((group) => (
                  <SidebarGroup
                    key={group.key}
                    title={group.title}
                    items={group.items}
                    pathname={pathname}
                    isOpen={openGroup === group.key}
                    isActive={activeGroup === group.key}
                    onToggle={() => {
                      setOpenGroup((prev) => (prev === group.key ? null : group.key));
                    }}
                    groupTitleClass={groupTitleTone}
                    linkClass={linkTone}
                    activeLinkClass={activeLinkTone}
                  />
                ))}
            </div>
            <div className="mt-auto space-y-3 pt-4">
              <Link
                href="/settings"
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                  settingsActive
                    ? sidebarDark
                      ? "border-transparent bg-[hsl(var(--brand-primary-1))] text-white"
                      : "border-[hsl(var(--brand-primary-8))] bg-[hsl(var(--brand-primary-10))] text-[hsl(var(--brand-secondary-1))]"
                    : sidebarDark
                      ? "border-white/10 text-slate-200 hover:bg-[hsl(var(--brand-dark-8))]"
                      : "border-border/60 text-slate-700 hover:bg-muted"
                }`}
              >
                <Settings2 className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span className="text-sm">Dark sidebar</span>
                <Switch checked={sidebarDark} onCheckedChange={setSidebarDark} />
              </div>
            </div>
          </div>
        </aside>
        <div className="flex h-screen flex-col">
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
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({
  title,
  items,
  pathname,
  isOpen,
  isActive,
  onToggle,
  groupTitleClass,
  linkClass,
  activeLinkClass,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  groupTitleClass: string;
  linkClass: string;
  activeLinkClass: string;
}) {
  const visible = items.filter((item) => item.show);
  if (visible.length === 0) return null;
  const activeHref = visible
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  if (title === "Overview") {
    const item = visible[0];
    if (!item) return null;
    const active = item.href === activeHref;


    const Icon = item.icon;
    return (
      <nav className="space-y-1">
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${active ? activeLinkClass : linkClass}`}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </nav>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wide ${groupTitleClass}`}
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""} ${!isActive ? "opacity-40" : ""}`} />
      </button>
      {isOpen ? (
        <nav className="space-y-1 px-2 pb-2">
          {visible.map((item) => {
            const active = item.href === activeHref;


    const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${active ? activeLinkClass : linkClass}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}





