/**
 * `infra-authz` 的管理面。⚠️ 路径不走 `/{domain}/{name}/**` 前缀（同其余组件
 * 不一样），逐字对应 `components/infra/authz/contracts/authz.openapi.yaml`。
 *
 * ⚠️ 契约里没有"列出全部权限键目录"这个端点（`SyncPermissionCatalog` 只在
 * 组件内部用，没有对外暴露），也没有"列出全部用户"（用户主数据在 Casdoor，
 * `infra-authz` 本组件不存用户表，见它自己的 AGENTS.md）。所以"给角色勾
 * 权限键"与"给谁分配角色"这两处，页面上只能是自由输入（权限键让管理员
 * 抄 `registry/permissions.tsv`，用户 sub 让管理员从 Casdoor 管理面拿），
 * 不是本次实现遗漏了下拉选择器——是真的没有数据源可选。
 */
import { authedFetch } from "./http";

export interface Role {
  code: string;
  name: string;
  is_system: boolean;
  permission_keys: string[];
}

export interface UserRole {
  role_code: string;
  expires_at?: string;
}

export async function listRoles(): Promise<Role[]> {
  const { roles } = (await authedFetch("/api/admin/roles")) as { roles: Role[] };
  return roles;
}

export async function createRole(code: string, name: string): Promise<Role> {
  return authedFetch("/api/admin/roles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, name }),
  }) as Promise<Role>;
}

export async function deleteRole(code: string): Promise<void> {
  await authedFetch(`/api/admin/roles/${encodeURIComponent(code)}`, { method: "DELETE" });
}

export async function grantRolePermission(code: string, permissionKey: string): Promise<void> {
  await authedFetch(`/api/admin/roles/${encodeURIComponent(code)}/permissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ permission_key: permissionKey }),
  });
}

export async function revokeRolePermission(code: string, key: string): Promise<void> {
  await authedFetch(`/api/admin/roles/${encodeURIComponent(code)}/permissions/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

export async function listUserRoles(sub: string): Promise<UserRole[]> {
  const { roles } = (await authedFetch(`/api/admin/users/${encodeURIComponent(sub)}/roles`)) as { roles: UserRole[] };
  return roles;
}

export async function grantUserRole(sub: string, roleCode: string, expiresAt?: string): Promise<void> {
  await authedFetch(`/api/admin/users/${encodeURIComponent(sub)}/roles`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role_code: roleCode, ...(expiresAt ? { expires_at: expiresAt } : {}) }),
  });
}

export async function revokeUserRole(sub: string, roleCode: string): Promise<void> {
  await authedFetch(`/api/admin/users/${encodeURIComponent(sub)}/roles/${encodeURIComponent(roleCode)}`, {
    method: "DELETE",
  });
}

export async function revokeAllUserRoles(sub: string): Promise<void> {
  await authedFetch(`/api/admin/users/${encodeURIComponent(sub)}/revoke`, { method: "POST" });
}
