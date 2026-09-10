/**
 * 登录完成之后（不管是刚换完 token 还是靠 refresh token 静默恢复）都要走的
 * 同一段收尾：拉 features + permissions，按交集注册业务路由（design.md §3.3）。
 * `CallbackView`（首次登录）与 `App.vue`（带着 localStorage 里的 refresh
 * token 刷新页面）两处入口共用这一个函数，避免两份注册逻辑慢慢长歪。
 */
import { useAccessStore } from "../stores/access";
import { registerBusinessRoutes } from "../router";

export async function bootstrapAfterAuth(): Promise<void> {
  const access = useAccessStore();
  await Promise.all([access.loadFeatures(), access.loadPermissions()]);
  registerBusinessRoutes();
}
