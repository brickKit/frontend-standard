<script setup lang="ts">
/**
 * 角色管理 + 给人授角色（design.md §1.1："没有它就没法验权限判定"）。
 * 契约与逃生口的说明见 `api/authz.ts` 顶部注释。
 */
import { onMounted, reactive, ref } from "vue";
import { Button, Form, FormItem, Input, message, Modal, Space, Tabs, TabPane, Tag } from "ant-design-vue";
import { BeSettingsPage, BeTable } from "@be/ui-kit-pc";
import {
  createRole,
  deleteRole,
  grantRolePermission,
  grantUserRole,
  listRoles,
  listUserRoles,
  revokeAllUserRoles,
  revokeRolePermission,
  revokeUserRole,
  type Role,
  type UserRole,
} from "../../api/authz";

const roles = ref<Role[]>([]);
const loadingRoles = ref(false);

async function reloadRoles(): Promise<void> {
  loadingRoles.value = true;
  try {
    roles.value = await listRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loadingRoles.value = false;
  }
}

const roleColumns = [
  { field: "code", title: "代码", width: 160 },
  { field: "name", title: "名称", width: 160 },
  { field: "is_system", title: "系统角色", width: 100, slots: { default: "isSystem" } },
  { field: "permission_keys", title: "权限键", slots: { default: "permKeys" } },
  { field: "_actions", title: "操作", width: 220, slots: { default: "actions" } },
];

// 新建角色
const createOpen = ref(false);
const createForm = reactive({ code: "", name: "" });
async function submitCreate(): Promise<void> {
  if (!createForm.code || !createForm.name) {
    message.warning("代码与名称都必填");
    return;
  }
  try {
    await createRole(createForm.code, createForm.name);
    message.success("角色已创建");
    createOpen.value = false;
    createForm.code = "";
    createForm.name = "";
    await reloadRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "创建失败");
  }
}

async function handleDelete(role: Role): Promise<void> {
  if (role.is_system) return;
  try {
    await deleteRole(role.code);
    message.success("已删除");
    await reloadRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "删除失败");
  }
}

// 编辑权限键
const permEditOpen = ref(false);
const permEditRole = ref<Role | null>(null);
const newPermKey = ref("");
function openPermEdit(role: Role): void {
  permEditRole.value = role;
  permEditOpen.value = true;
}
async function addPermKey(): Promise<void> {
  if (!permEditRole.value || !newPermKey.value.trim()) return;
  try {
    await grantRolePermission(permEditRole.value.code, newPermKey.value.trim());
    newPermKey.value = "";
    await reloadRoles();
    permEditRole.value = roles.value.find((r) => r.code === permEditRole.value?.code) ?? null;
  } catch (err) {
    message.error(err instanceof Error ? err.message : "添加失败");
  }
}
async function removePermKey(key: string): Promise<void> {
  if (!permEditRole.value) return;
  try {
    await revokeRolePermission(permEditRole.value.code, key);
    await reloadRoles();
    permEditRole.value = roles.value.find((r) => r.code === permEditRole.value?.code) ?? null;
  } catch (err) {
    message.error(err instanceof Error ? err.message : "移除失败");
  }
}

// 用户授权
const userSub = ref("");
const userRoles = ref<UserRole[]>([]);
const grantRoleCode = ref("");
async function loadUserRoles(): Promise<void> {
  if (!userSub.value.trim()) return;
  try {
    userRoles.value = await listUserRoles(userSub.value.trim());
  } catch (err) {
    message.error(err instanceof Error ? err.message : "查询失败");
  }
}
async function grantToUser(): Promise<void> {
  if (!userSub.value.trim() || !grantRoleCode.value.trim()) return;
  try {
    await grantUserRole(userSub.value.trim(), grantRoleCode.value.trim());
    grantRoleCode.value = "";
    message.success("已授权");
    await loadUserRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "授权失败");
  }
}
async function revokeFromUser(roleCode: string): Promise<void> {
  try {
    await revokeUserRole(userSub.value.trim(), roleCode);
    await loadUserRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "撤销失败");
  }
}
async function revokeAll(): Promise<void> {
  try {
    await revokeAllUserRoles(userSub.value.trim());
    message.success("已撤销该用户的全部角色");
    await loadUserRoles();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "撤销失败");
  }
}

onMounted(reloadRoles);
</script>

<template>
  <BeSettingsPage title="角色管理" description="角色是权限键的并集容器；用户拿到的权限 = 他持有的全部角色的权限键并集（无 Deny）">
    <Tabs>
      <TabPane key="roles" tab="角色">
        <Space style="margin-bottom: 12px">
          <Button type="primary" @click="createOpen = true">新建角色</Button>
        </Space>
        <BeTable :columns="roleColumns" :data="roles" :loading="loadingRoles" row-key="code" @refresh="reloadRoles">
          <template #isSystem="{ row }">{{ row.is_system ? "是" : "否" }}</template>
          <template #permKeys="{ row }">
            <Tag v-for="k in row.permission_keys" :key="k">{{ k }}</Tag>
          </template>
          <template #actions="{ row }">
            <Space>
              <Button size="small" @click="openPermEdit(row)">编辑权限</Button>
              <Button size="small" danger :disabled="row.is_system" @click="handleDelete(row)">删除</Button>
            </Space>
          </template>
        </BeTable>
      </TabPane>

      <TabPane key="user-roles" tab="用户授权">
        <Form layout="inline" style="margin-bottom: 12px">
          <FormItem label="用户 sub">
            <Input v-model:value="userSub" placeholder="从 Casdoor 管理面拿的用户标识" style="width: 280px" />
          </FormItem>
          <FormItem>
            <Button @click="loadUserRoles">查询</Button>
          </FormItem>
        </Form>

        <template v-if="userSub">
          <Space style="margin-bottom: 12px">
            <Input v-model:value="grantRoleCode" placeholder="角色代码" style="width: 200px" />
            <Button type="primary" @click="grantToUser">授权</Button>
            <Button danger @click="revokeAll">撤销全部角色（踢人）</Button>
          </Space>
          <div v-for="ur in userRoles" :key="ur.role_code" class="user-role-row">
            <Tag>{{ ur.role_code }}</Tag>
            <span v-if="ur.expires_at" class="expires">到期 {{ ur.expires_at }}</span>
            <Button size="small" danger @click="revokeFromUser(ur.role_code)">撤销</Button>
          </div>
        </template>
      </TabPane>
    </Tabs>
  </BeSettingsPage>

  <Modal v-model:open="createOpen" title="新建角色" @ok="submitCreate">
    <Form layout="vertical">
      <FormItem label="代码"><Input v-model:value="createForm.code" placeholder="如 mobile_user" /></FormItem>
      <FormItem label="名称"><Input v-model:value="createForm.name" /></FormItem>
    </Form>
  </Modal>

  <Modal v-model:open="permEditOpen" :title="`编辑权限键 · ${permEditRole?.code ?? ''}`" :footer="null">
    <Space wrap style="margin-bottom: 12px">
      <Tag v-for="k in permEditRole?.permission_keys ?? []" :key="k" closable @close.prevent="removePermKey(k)">
        {{ k }}
      </Tag>
    </Space>
    <Space>
      <Input v-model:value="newPermKey" placeholder="权限键，如 erp.sales.view" style="width: 260px" />
      <Button type="primary" @click="addPermKey">添加</Button>
    </Space>
  </Modal>
</template>

<style scoped>
.user-role-row {
  display: flex;
  align-items: center;
  gap: var(--be-space-sm);
  padding: var(--be-space-sm) 0;
}
.expires {
  color: var(--be-color-text-secondary);
  font-size: var(--be-font-size-sm);
}
</style>
