"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BellRing,
  Check,
  ChevronRight,
  KeyRound,
  LayoutGrid,
  Megaphone,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AdAnalyticsClient } from "@/components/ads/ad-analytics-client";
import { AdCampaignsClient } from "@/components/ads/ad-campaigns-client";
import { AdSlotsClient } from "@/components/ads/ad-slots-client";
import {
  listPermissions,
  listRolePermissions,
  listRoles,
  updateRolePermissions,
  type Permission,
  type Role,
  type RolePermission,
} from "@/lib/api/roles";
import { listUsers, type User } from "@/lib/api/users";
import { hasPermission, isSuperadmin, type AdminMe } from "@/lib/permissions";

type SettingsSectionId = "profile" | "security" | "appearance" | "team" | "rbac" | "ads";

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  icon: typeof UserRound;
  description: string;
};

function MatrixCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = false;
    }
  }, []);

  return (
    <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-slate-300 bg-white shadow-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-[hsl(var(--primary))]">
        {checked ? <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> : null}
      </span>
    </label>
  );
}

function buildPermissionDrafts(
  nextRoles: Role[],
  nextPermissions: Permission[],
  nextMappings: RolePermission[],
) {
  const permissionsByName = new Map(nextPermissions.map((permission) => [permission.name, permission.id]));
  return Object.fromEntries(
    nextRoles.map((role) => [
      role.id,
      nextMappings
        .filter((mapping) => mapping.role === role.name)
        .map((mapping) => permissionsByName.get(mapping.permission))
        .filter((id): id is string => Boolean(id)),
    ]),
  );
}

function formatPermissionLabel(permissionName: string) {
  return permissionName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPermissionGroup(permissionName: string) {
  const value = permissionName.toLowerCase();

  if (value.includes("user") || value.includes("role") || value.includes("permission")) {
    return "Access control";
  }
  if (value.includes("post") || value.includes("page") || value.includes("categor") || value.includes("review")) {
    return "Content operations";
  }
  if (value.includes("product") || value.includes("merchant") || value.includes("affiliate") || value.includes("amazon")) {
    return "Commerce and deals";
  }
  if (value.includes("ad")) {
    return "Advertising";
  }
  if (value.includes("job") || value.includes("sync") || value.includes("cron")) {
    return "Operations";
  }

  return "Platform";
}

function sortRoles(roles: Role[]) {
  return [...roles].sort((a, b) => {
    const priority = (roleName: string) => {
      const value = roleName.toLowerCase();
      if (value === "superadmin") return 0;
      if (value.includes("admin")) return 1;
      if (value.includes("manager")) return 2;
      if (value.includes("editor") || value.includes("content")) return 3;
      if (value.includes("customer")) return 5;
      return 4;
    };

    const diff = priority(a.name) - priority(b.name);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

function getRoleBadgeClass(roleName: string) {
  const value = roleName.toLowerCase();
  if (value === "superadmin") {
    return "bg-[hsl(var(--brand-primary-10))] text-[hsl(var(--brand-primary-1))]";
  }
  if (value.includes("content") || value.includes("editor")) {
    return "bg-sky-50 text-sky-700";
  }
  if (value.includes("customer")) {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
}

export function SettingsClient({ me }: { me: AdminMe }) {
  const canAccessCompany = isSuperadmin(me.role);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(canAccessCompany ? "team" : "profile");
  const [adsTab, setAdsTab] = useState("slots");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [mappings, setMappings] = useState<RolePermission[]>([]);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(canAccessCompany);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const personalSections: SettingsSection[] = [
    { id: "profile", label: "Profile", icon: UserRound, description: "Your account identity and access." },
    { id: "security", label: "Security", icon: KeyRound, description: "Passwords, sessions, and sign-in hygiene." },
  ];

  const companySections: SettingsSection[] = [
    { id: "appearance", label: "Appearance", icon: Sparkles, description: "Sidebar and workspace preferences." },
    { id: "team", label: "Team members", icon: Users, description: "Admins, roles, and permissions." },
    { id: "rbac", label: "RBAC", icon: ShieldCheck, description: "Role rules and permission mapping." },
    { id: "ads", label: "Ad operations", icon: Megaphone, description: "Campaign and inventory defaults." },
  ];

  async function loadTeamData() {
    if (!canAccessCompany) {
      return;
    }

    setLoading(true);
    try {
      const [usersData, rolesData, permissionsData, mappingsData] = await Promise.all([
        listUsers(),
        listRoles(),
        listPermissions(),
        listRolePermissions(),
      ]);

      const sortedRoles = sortRoles(rolesData);
      setUsers(usersData);
      setRoles(sortedRoles);
      setPermissions(permissionsData);
      setMappings(mappingsData);
      setPermissionDrafts(buildPermissionDrafts(sortedRoles, permissionsData, mappingsData));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeamData().catch(() => null);
  }, [canAccessCompany]);

  useEffect(() => {
    if (!canAccessCompany && activeSection !== "profile" && activeSection !== "security") {
      setActiveSection("profile");
    }
  }, [activeSection, canAccessCompany]);

  const baselineDrafts = useMemo(
    () => buildPermissionDrafts(roles, permissions, mappings),
    [roles, permissions, mappings],
  );

  const changedRoleIds = useMemo(
    () =>
      roles
        .filter((role) => {
          const current = [...(permissionDrafts[role.id] ?? [])].sort();
          const original = [...(baselineDrafts[role.id] ?? [])].sort();
          return current.length !== original.length || current.some((value, index) => value !== original[index]);
        })
        .map((role) => role.id),
    [baselineDrafts, permissionDrafts, roles],
  );

  const groupedPermissions = useMemo(() => {
    const order = [
      "Access control",
      "Content operations",
      "Commerce and deals",
      "Advertising",
      "Operations",
      "Platform",
    ];

    return order
      .map((group) => ({
        label: group,
        permissions: permissions
          .filter((permission) => getPermissionGroup(permission.name) === group)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [permissions]);

  const rolesById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const membersWithRoles = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        role: rolesById.get(user.roleId) ?? null,
      })),
    [rolesById, users],
  );

  const roleSummary = useMemo(
    () =>
      roles.map((role) => ({
        role,
        memberCount: users.filter((user) => user.roleId === role.id).length,
      })),
    [roles, users],
  );

  function getDraftPermissionIds(roleId: string) {
    return permissionDrafts[roleId] ?? [];
  }

  function toggleRolePermission(roleId: string, permissionId: string) {
    setPermissionDrafts((prev) => {
      const current = prev[roleId] ?? [];
      const next = current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId];
      return { ...prev, [roleId]: next };
    });
  }

  async function saveRoleChanges() {
    if (changedRoleIds.length === 0) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await Promise.all(
        changedRoleIds.map((roleId) => updateRolePermissions(roleId, permissionDrafts[roleId] ?? [])),
      );
      await loadTeamData();
      setMessage(
        changedRoleIds.length === 1
          ? "Saved permission changes for 1 role."
          : `Saved permission changes for ${changedRoleIds.length} roles.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save permission changes.");
    } finally {
      setSaving(false);
    }
  }

  function resetRoleChanges() {
    setPermissionDrafts(baselineDrafts);
    setMessage(null);
    setError(null);
  }

  const personalPermissionCount = me.permissions.length;
  const teamMemberCount = users.length;
  const activeRoleCount = roles.length;
  const contentAccess = hasPermission(me.permissions, "manage_posts") || hasPermission(me.permissions, "manage_categories");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--brand-secondary-1))]">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Bargainly workspace, access rules, and operator preferences from one place.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-white pb-4">
              <CardTitle className="text-lg">Personal</CardTitle>
              <CardDescription>Identity and preferences for your Bargainly operator account.</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {personalSections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition",
                        active
                          ? "bg-[hsl(var(--brand-primary-10))] text-[hsl(var(--brand-secondary-1))]"
                          : "text-slate-700 hover:bg-muted/70",
                      )}
                    >
                      <span className={cn("mt-0.5 rounded-lg p-2", active ? "bg-white text-primary" : "bg-muted text-slate-500")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="space-y-0.5">
                        <span className="block text-sm font-semibold">{section.label}</span>
                        <span className="block text-xs text-muted-foreground">{section.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {canAccessCompany ? (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-white pb-4">
                <CardTitle className="text-lg">Company</CardTitle>
                <CardDescription>Superadmin-only controls for the Bargainly organization.</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {companySections.map((section) => {
                    const Icon = section.icon;
                    const active = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition",
                          active
                            ? "bg-[hsl(var(--brand-primary-10))] text-[hsl(var(--brand-secondary-1))]"
                            : "text-slate-700 hover:bg-muted/70",
                        )}
                      >
                        <span className={cn("mt-0.5 rounded-lg p-2", active ? "bg-white text-primary" : "bg-muted text-slate-500")}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="space-y-0.5">
                          <span className="block text-sm font-semibold">{section.label}</span>
                          <span className="block text-xs text-muted-foreground">{section.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          {activeSection === "profile" ? (
            <div className="space-y-6">
              <Card className="overflow-hidden border-[hsl(var(--brand-primary-9))]">
                <CardHeader className="border-b border-border bg-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">Profile</CardTitle>
                      <CardDescription>Your Bargainly admin identity and workspace footprint.</CardDescription>
                    </div>
                    <Badge className={cn("w-fit", getRoleBadgeClass(me.role || "member"))}>
                      {me.role || "member"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Signed in as</div>
                    <div className="mt-2 text-base font-semibold text-[hsl(var(--brand-secondary-1))]">{me.user?.email}</div>
                    <p className="mt-1 text-sm text-muted-foreground">Use this account for Bargainly CMS operations.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Permissions</div>
                    <div className="mt-2 text-3xl font-semibold text-[hsl(var(--brand-secondary-1))]">{personalPermissionCount}</div>
                    <p className="mt-1 text-sm text-muted-foreground">Active permissions assigned through your current role.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Editorial access</div>
                    <div className="mt-2 flex items-center gap-2 text-base font-semibold text-[hsl(var(--brand-secondary-1))]">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                      {contentAccess ? "Enabled" : "Limited"}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Publishing-related access based on your current role.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "security" ? (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-white">
                <CardTitle className="text-2xl">Security</CardTitle>
                <CardDescription>Keep your Bargainly admin access safe and easy to audit.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--brand-secondary-1))]">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Better Auth session protection
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Authentication is powered by Better Auth with role-aware permission checks across the admin workspace.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--brand-secondary-1))]">
                    <BellRing className="h-4 w-4 text-primary" />
                    Sign-in hygiene
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Review your active role assignments before making content, monetization, or access-control changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "appearance" ? (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-white">
                <CardTitle className="text-2xl">Appearance</CardTitle>
                <CardDescription>Workspace presentation settings for long editorial sessions.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--brand-secondary-1))]">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    Sidebar theme
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use the sidebar toggle to switch between the bright workspace shell and the dark navigation mode.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--brand-secondary-1))]">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Brand-first layout
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This settings surface follows Bargainly's orange-and-charcoal identity rather than a generic admin template.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "ads" ? (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-white">
                <CardTitle className="text-2xl">Ad operations</CardTitle>
                <CardDescription>Campaign and inventory controls for the monetization side of the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <Tabs value={adsTab} onValueChange={setAdsTab}>
                  <TabsList>
                    <TabsTrigger value="slots">Ad Slots</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="slots" className="mt-5">
                    <AdSlotsClient />
                  </TabsContent>
                  <TabsContent value="campaigns" className="mt-5">
                    <AdCampaignsClient />
                  </TabsContent>
                  <TabsContent value="analytics" className="mt-5">
                    <AdAnalyticsClient />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "team" ? (
            <div className="space-y-5">
              <Card className="overflow-hidden border-[hsl(var(--brand-primary-9))]">
                <CardHeader className="border-b border-border bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--brand-primary-1))]">
                        <Users className="h-3.5 w-3.5" />
                        Team access
                      </div>
                      <CardTitle className="text-2xl">Team members</CardTitle>
                      <CardDescription>
                        Invite, manage, and govern Bargainly operators with a role matrix tailored to your current access model.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href="/users"
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        <Plus className="h-4 w-4" />
                        Add member
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Members</div>
                    <div className="mt-2 text-3xl font-semibold text-[hsl(var(--brand-secondary-1))]">
                      {loading ? "..." : teamMemberCount}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Signed-in team accounts with admin workspace access.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Roles</div>
                    <div className="mt-2 text-3xl font-semibold text-[hsl(var(--brand-secondary-1))]">
                      {loading ? "..." : activeRoleCount}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Permission bundles available across the Bargainly team.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">My role</div>
                    <div className="mt-2">
                      <Badge className={cn("w-fit", getRoleBadgeClass(me.role || "member"))}>{me.role || "member"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your current role defines what parts of the workspace you can change.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/40 text-left text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Member</th>
                          <th className="px-5 py-3 font-semibold">Role</th>
                          <th className="px-5 py-3 font-semibold">Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membersWithRoles.map((user) => (
                          <tr key={user.id} className="border-t border-border">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand-primary-10))] text-sm font-semibold text-[hsl(var(--brand-primary-1))]">
                                  {user.email.slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-[hsl(var(--brand-secondary-1))]">{user.email}</div>
                                  <div className="text-xs text-muted-foreground">Operator ID: {user.id.slice(0, 8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <Badge className={cn("w-fit", getRoleBadgeClass(user.role?.name || "member"))}>
                                {user.role?.name || "unassigned"}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {isSuperadmin(user.role?.name) ? "Full platform access" : "Scoped workspace access"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "rbac" ? (
            <div className="space-y-5">
              <Card className="overflow-hidden border-[hsl(var(--brand-primary-9))]">
                <CardHeader className="border-b border-border bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[hsl(var(--brand-primary-10))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--brand-primary-1))]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Access control
                      </div>
                      <CardTitle className="text-2xl">RBAC</CardTitle>
                      <CardDescription>
                        Adjust Bargainly workspace permissions per role and save changes in one batch.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {roleSummary.map(({ role, memberCount }) => (
                        <Badge key={role.id} className={cn("px-3 py-1", getRoleBadgeClass(role.name))}>
                          {role.name}: {memberCount}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="sticky left-0 z-20 w-[280px] border-b border-r border-border bg-white px-4 py-3 font-semibold text-[hsl(var(--brand-secondary-1))]">
                            Actions
                          </th>
                          {roles.map((role) => (
                            <th
                              key={role.id}
                              className="w-[132px] border-b border-border bg-white px-2 py-3 text-center font-semibold"
                            >
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-[hsl(var(--brand-secondary-1))]">{role.name}</div>
                                {role.description ? (
                                  <div className="text-[10px] font-normal leading-3 text-slate-500">{role.description}</div>
                                ) : null}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPermissions.map((group) => (
                          <FragmentPermissionGroup
                            key={group.label}
                            groupLabel={group.label}
                            permissions={group.permissions}
                            roles={roles}
                            getDraftPermissionIds={getDraftPermissionIds}
                            saving={saving}
                            onToggle={toggleRolePermission}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      {changedRoleIds.length === 0
                        ? "No unsaved permission changes."
                        : `${changedRoleIds.length} role${changedRoleIds.length === 1 ? "" : "s"} updated but not yet saved.`}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={resetRoleChanges}
                        disabled={changedRoleIds.length === 0 || saving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveRoleChanges} disabled={changedRoleIds.length === 0 || saving}>
                        {saving ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FragmentPermissionGroup({
  groupLabel,
  permissions,
  roles,
  getDraftPermissionIds,
  saving,
  onToggle,
}: {
  groupLabel: string;
  permissions: Permission[];
  roles: Role[];
  getDraftPermissionIds: (roleId: string) => string[];
  saving: boolean;
  onToggle: (roleId: string, permissionId: string) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={roles.length + 1}
          className="border-b border-t border-border bg-[hsl(var(--brand-primary-10))] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--brand-secondary-2))]"
        >
          {groupLabel}
        </td>
      </tr>
      {permissions.map((permission) => (
        <tr key={permission.id}>
          <td className="sticky left-0 z-10 border-b border-r border-border bg-white px-4 py-3">
            <div className="space-y-1">
              <div className="font-medium text-[hsl(var(--brand-secondary-1))]">{formatPermissionLabel(permission.name)}</div>
              <div className="text-xs text-muted-foreground">{permission.description || permission.name}</div>
            </div>
          </td>
          {roles.map((role) => (
            <td key={`${permission.id}-${role.id}`} className="border-b border-border px-2 py-3 text-center">
              <div className="flex items-center justify-center">
                <MatrixCheckbox
                  checked={getDraftPermissionIds(role.id).includes(permission.id)}
                  disabled={saving}
                  onChange={() => onToggle(role.id, permission.id)}
                />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
