"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { listPermissions, listRolePermissions, listRoles } from "@/lib/cms-api";

export function RbacClient() {
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [permissions, setPermissions] = useState<Array<{ id: string; name: string }>>([]);
  const [mappings, setMappings] = useState<Array<{ role: string; permission: string }>>([]);

  useEffect(() => {
    Promise.all([listRoles(), listPermissions(), listRolePermissions()])
      .then(([rolesData, permissionsData, mappingData]) => {
        setRoles(rolesData);
        setPermissions(permissionsData);
        setMappings(mappingData);
      })
      .catch(() => {
        setRoles([]);
        setPermissions([]);
        setMappings([]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">RBAC</h2>

      <section>
        <h3 className="mb-2 font-semibold">Roles</h3>
        <DataTable rows={roles} columns={[{ key: "name", header: "Name" }, { key: "description", header: "Description" }]} />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Permissions</h3>
        <DataTable rows={permissions} columns={[{ key: "name", header: "Permission" }]} />
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Role-Permission Map</h3>
        <DataTable rows={mappings} columns={[{ key: "role", header: "Role" }, { key: "permission", header: "Permission" }]} />
      </section>

      <p className="text-xs text-slate-500">Read-only MVP view. Connect write endpoints later if needed.</p>
    </div>
  );
}
