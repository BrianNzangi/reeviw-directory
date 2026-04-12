export type Role = {
  id: string;
  name: string;
  description?: string;
};

export type Permission = {
  id: string;
  name: string;
  description?: string;
};

export type RolePermission = {
  role: string;
  permission: string;
};
