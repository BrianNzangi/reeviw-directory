"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Select } from "@/components/ui/select";
import { listRoles, listUsers, updateUserRole } from "@/lib/cms-api";

export function UsersClient() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; roleId: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);

  async function load() {
    const [usersResponse, rolesResponse] = await Promise.all([listUsers(), listRoles()]);
    setUsers(usersResponse);
    setRoles(rolesResponse.map((role) => ({ id: role.id, name: role.name })));
  }

  useEffect(() => {
    load().catch(() => {
      setUsers([]);
      setRoles([]);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Users</h2>
      <DataTable
        rows={users}
        columns={[
          { key: "email", header: "Email" },
          {
            key: "roleId",
            header: "Role",
            render: (row) => (
              <Select
                value={row.roleId}
                onValueChange={async (value) => {
                  await updateUserRole(row.id, value);
                  await load();
                }}
                options={roles.map((role) => ({ value: role.id, label: role.name }))}
              />
            ),
          },
        ]}
      />
      <p className="text-xs text-slate-500">If `/api/users` or `/api/roles` is unavailable, this view remains compatible and can be wired once backend endpoints are added.</p>
    </div>
  );
}
