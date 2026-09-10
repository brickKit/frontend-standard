/**
 * 应用内路由/菜单的静态登记表。真实的"最终形态"是 be-ops 在生成期把
 * 62 份 `assembly.yaml` 的 `menus` 段聚合成一份产出物（根 AGENTS.md
 * 路由表："菜单来自 62 份 assembly.yaml 生成期聚合"）；本阶段 be-ops
 * 还没有为这份产出物接一个真实的生成器（不在 Task 12 范围内——那是
 * `be-ops` 自己的工具链改动，见总纲 §2.4），所以这里先手工维护，
 * 手工维护的内容与各组件 `assembly.yaml` 里已经登记的 `menus`/
 * `permissions` 段逐条对应，不是凭空发明的路由。
 *
 * `componentId` 对应 `/api/tenant/features` 返回的 `enabled_components`
 * 数组元素（`component.yaml` 的 `metadata.id`），`permission` 对应
 * `/api/me/permissions` 返回的 `keys` 数组元素——可见路由 = 两者的交集
 * （design.md §3.3，导读第 20 条）。
 */
export interface MenuEntry {
  path: string;
  title: string;
  group: string;
  componentId: string;
  permission: string;
}

// ⚠️ 权限键逐条核对自各组件真实的 `assembly.yaml`（`registry/permissions.tsv`
// 本身滞后于阶段三新建的几个组件，只到 mdm/erp 五个组件为止，不能当真相源用）。
export const MENU_REGISTRY: MenuEntry[] = [
  { path: "/sales/orders", title: "销售订单", group: "销售", componentId: "erp/sales", permission: "erp.sales.view" },
  { path: "/workflow/tasks", title: "我的待办", group: "审批", componentId: "infra/workflow", permission: "infra.workflow.task.view" },
  { path: "/notifications", title: "通知中心", group: "通知", componentId: "infra/notification", permission: "infra.notification.view" },
  { path: "/authz/roles", title: "角色管理", group: "系统管理", componentId: "infra/authz", permission: "infra.authz.admin" },
  { path: "/mdm/customers", title: "客户", group: "主数据", componentId: "mdm/customer", permission: "mdm.customer.view" },
  { path: "/mdm/products", title: "产品", group: "主数据", componentId: "mdm/product", permission: "mdm.product.view" },
  { path: "/inventory/balances", title: "库存查询", group: "库存", componentId: "erp/inventory", permission: "erp.inventory.view" },
  { path: "/finance/receivables", title: "应收查询", group: "财务", componentId: "erp/finance", permission: "erp.finance.view" },
];
