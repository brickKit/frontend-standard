import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useAccessStore } from "../stores/access";
import { MENU_REGISTRY } from "./menuRegistry";

const STATIC_ROUTES: RouteRecordRaw[] = [
  { path: "/login", name: "login", component: () => import("../pages/LoginView.vue"), meta: { public: true } },
  { path: "/callback", name: "callback", component: () => import("../pages/CallbackView.vue"), meta: { public: true } },
  { path: "/403", name: "forbidden", component: () => import("../pages/ForbiddenView.vue"), meta: { public: true } },
  { path: "/", name: "home", component: () => import("../pages/HomeView.vue") },
  { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("../pages/NotFoundView.vue"), meta: { public: true } },
];

/** 每个业务路径对应哪个页面组件——懒加载，登录前一个都不会被下载。 */
const PAGE_COMPONENTS: Record<string, () => Promise<unknown>> = {
  "/sales/orders": () => import("../pages/sales/OrderListView.vue"),
  "/sales/orders/:id": () => import("../pages/sales/OrderDetailView.vue"),
  "/workflow/tasks": () => import("../pages/workflow/TaskListView.vue"),
  "/workflow/tasks/:id": () => import("../pages/workflow/TaskDetailView.vue"),
  "/notifications": () => import("../pages/notification/NotificationListView.vue"),
  "/authz/roles": () => import("../pages/authz/RoleListView.vue"),
  "/mdm/customers": () => import("../pages/mdm/CustomerListView.vue"),
  "/mdm/customers/:id": () => import("../pages/mdm/CustomerDetailView.vue"),
  "/mdm/products": () => import("../pages/mdm/ProductListView.vue"),
  "/inventory/balances": () => import("../pages/inventory/BalanceQueryView.vue"),
  "/finance/receivables": () => import("../pages/finance/ReceivableQueryView.vue"),
};

export const router = createRouter({
  history: createWebHistory(),
  routes: STATIC_ROUTES,
});

let businessRoutesRegistered = false;

/**
 * 按 features ∩ permissions 动态挂载路由（design.md §3.3）。只在登录后、
 * `access` store 两份数据都拉到之后调一次——调用方是 `App.vue` 的启动流程。
 * 用 `router.addRoute` 而不是一次性把全部路由塞进 `STATIC_ROUTES`，是因为
 * 不可见的菜单项对应的路径本来就不该能直接 URL 硬输进去绕过权限判定
 * （§14.1.8："前端判定从来不是安全边界"，但能不注册就不注册，减少一层
 * "看起来能进但后端 403"的困惑）。
 */
export function registerBusinessRoutes(): void {
  if (businessRoutesRegistered) return;
  const access = useAccessStore();

  for (const entry of access.visibleMenu) {
    const component = PAGE_COMPONENTS[entry.path];
    if (!component) continue;
    router.addRoute({ path: entry.path, name: `menu:${entry.path}`, component });

    const detailPath = `${entry.path}/:id`;
    const detailComponent = PAGE_COMPONENTS[detailPath];
    if (detailComponent) {
      router.addRoute({ path: detailPath, name: `menu:${detailPath}`, component: detailComponent });
    }
  }
  businessRoutesRegistered = true;
}

export function resetBusinessRoutes(): void {
  businessRoutesRegistered = false;
}

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated()) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

export { MENU_REGISTRY };
