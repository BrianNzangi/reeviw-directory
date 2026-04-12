"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe2, Search, UserRound } from "lucide-react";
import {
  listPermissions,
  listRolePermissions,
  listRoles,
  updateRolePermissions,
  type Permission,
  type Role,
  type RolePermission,
} from "@/lib/api/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

function getRoleIcon(roleName: string) {
  const normalized = roleName.toLowerCase();
  if (normalized.includes("site")) {
    return Globe2;
  }
  return UserRound;
}

export function RbacClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [mappings, setMappings] = useState<RolePermission[]>([]);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [rolesData, permissionsData, mappingData] = await Promise.all([
      listRoles(),
      listPermissions(),
      listRolePermissions(),
    ]);

    setRoles(rolesData);
    setPermissions(permissionsData);
    setMappings(mappingData);
    setPermissionDrafts(buildPermissionDrafts(rolesData, permissionsData, mappingData));
  }

  useEffect(() => {
    load().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load RBAC data.");
      setRoles([]);
      setPermissions([]);
      setMappings([]);
      setPermissionDrafts({});
    });
  }, []);

  const baselineDrafts = useMemo(
    () => buildPermissionDrafts(roles, permissions, mappings),
    [roles, permissions, mappings],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const roleMatches = useMemo(() => {
    if (!normalizedSearch) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.description || ""}`.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, roles]);

  const permissionMatches = useMemo(() => {
    if (!normalizedSearch) return permissions;
    return permissions.filter((permission) => permission.name.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch, permissions]);

  const filteredRoles = useMemo(() => {
    if (!normalizedSearch) return roles;
    if (roleMatches.length > 0 && permissionMatches.length === 0) return roleMatches;
    if (roleMatches.length === 0 && permissionMatches.length > 0) return roles;
    return roleMatches;
  }, [normalizedSearch, permissionMatches.length, roleMatches, roles]);

  const filteredPermissions = useMemo(() => {
    if (!normalizedSearch) return permissions;
    if (permissionMatches.length > 0 && roleMatches.length === 0) return permissionMatches;
    if (permissionMatches.length === 0 && roleMatches.length > 0) return permissions;
    return permissionMatches;
  }, [normalizedSearch, permissionMatches, permissions, roleMatches.length]);

  function getDraftPermissionIds(roleId: string) {
    return permissionDrafts[roleId] ?? [];
  }

  function hasRoleChanges(roleId: string) {
    const current = [...(permissionDrafts[roleId] ?? [])].sort();
    const original = [...(baselineDrafts[roleId] ?? [])].sort();
    return current.length !== original.length || current.some((value, index) => value !== original[index]);
  }

  const changedRoleIds = useMemo(
    () => roles.filter((role) => hasRoleChanges(role.id)).map((role) => role.id),
    [permissionDrafts, baselineDrafts, roles],
  );

  function toggleRolePermission(roleId: string, permissionId: string) {
    setPermissionDrafts((prev) => {
      const current = prev[roleId] ?? [];
      const next = current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId];
      return { ...prev, [roleId]: next };
    });
  }

  async function saveAllChanges() {
    if (changedRoleIds.length === 0) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await Promise.all(
        changedRoleIds.map((roleId) => updateRolePermissions(roleId, permissionDrafts[roleId] ?? [])),
      );
      await load();
      setMessage(
        changedRoleIds.length === 1
          ? "Permissions saved for 1 role."
          : `Permissions saved for ${changedRoleIds.length} roles.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save permission changes.");
    } finally {
      setSaving(false);
    }
  }

  function resetAllChanges() {
    setPermissionDrafts(baselineDrafts);
    setMessage(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Permissions</CardTitle>
              <CardDescription>
                Review role access in one matrix and save all permission updates together.
              </CardDescription>
            </div>
            {changedRoleIds.length > 0 ? (
              <Badge className="bg-amber-100 text-amber-800">
                {changedRoleIds.length} role{changedRoleIds.length === 1 ? "" : "s"} changed
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700">No unsaved changes</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-0">
          <div className="px-6 pt-6">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search for roles or permissions"
                className="h-14 rounded-xl bg-slate-50 pl-5 pr-14 text-base"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-4 px-6 lg:hidden">
            {filteredRoles.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No roles or permissions matched your search.
              </div>
            ) : (
              filteredRoles.map((role) => {
                const RoleIcon = getRoleIcon(role.name);
                const selectedCount = getDraftPermissionIds(role.id).length;

                return (
                  <div key={role.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <RoleIcon className="mt-0.5 h-5 w-5 text-slate-700" />
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">{role.name}</div>
                          {role.description ? (
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          ) : null}
                        </div>
                      </div>
                      <Badge className={hasRoleChanges(role.id) ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>
                        {selectedCount} selected
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {filteredPermissions.map((permission) => {
                        const active = getDraftPermissionIds(role.id).includes(permission.id);
                        return (
                          <label
                            key={`${role.id}-${permission.id}-mobile`}
                            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                              active
                                ? "border-primary bg-primary/10"
                                : "border-border bg-white hover:bg-muted/50"
                            }`}
                          >
                            <span className="leading-5 text-foreground">{permission.name}</span>
                            <MatrixCheckbox
                              checked={active}
                              disabled={saving}
                              onChange={() => toggleRolePermission(role.id, permission.id)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[220px] border-b border-r border-border bg-card px-3 py-3 font-semibold text-foreground">
                    Permission
                  </th>
                  {filteredRoles.map((role) => {
                    const RoleIcon = getRoleIcon(role.name);
                    const selectedCount = getDraftPermissionIds(role.id).length;

                    return (
                      <th
                        key={role.id}
                        className="w-[140px] border-b border-border bg-card px-2 py-3 text-center font-semibold"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <RoleIcon className="h-4 w-4 text-slate-700" />
                          <span className="text-xs font-semibold leading-4 text-foreground">{role.name}</span>
                          {role.description ? (
                            <span className="line-clamp-2 text-[10px] font-normal leading-3 text-slate-500">
                              {role.description}
                            </span>
                          ) : null}
                          {hasRoleChanges(role.id) ? (
                            <Badge className="mt-1 bg-amber-100 px-2 py-0 text-[10px] text-amber-800">
                              {selectedCount} selected
                            </Badge>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.length === 0 || filteredRoles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(1, filteredRoles.length + 1)}
                      className="px-6 py-10 text-center text-muted-foreground"
                    >
                      No roles or permissions matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission) => {
                    return (
                      <tr key={permission.id}>
                        <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold leading-4 text-foreground">
                              {permission.name.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                              {permission.name}
                            </div>
                          </div>
                        </td>
                        {filteredRoles.map((role) => (
                          <td
                            key={`${permission.id}-${role.id}`}
                            className="border-b border-border px-1 py-2 text-center"
                          >
                            <div className="flex items-center justify-center">
                              <MatrixCheckbox
                                checked={getDraftPermissionIds(role.id).includes(permission.id)}
                                disabled={saving}
                                onChange={() => toggleRolePermission(role.id, permission.id)}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span>{roles.length} role{roles.length === 1 ? "" : "s"}</span>
              <span>
                Showing {filteredRoles.length} of {roles.length} role{roles.length === 1 ? "" : "s"}
              </span>
              <span>{permissions.length} permission{permissions.length === 1 ? "" : "s"} available</span>
              <span>
                Showing {filteredPermissions.length} filtered permission{filteredPermissions.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
              <Button
                variant="secondary"
                onClick={resetAllChanges}
                disabled={changedRoleIds.length === 0 || saving}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={saveAllChanges}
                disabled={changedRoleIds.length === 0 || saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
