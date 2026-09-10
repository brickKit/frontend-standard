import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import VxeUIBase from "vxe-pc-ui";
import "vxe-pc-ui/lib/style.css";
import VxeUITable from "vxe-table";
import "vxe-table/lib/style.css";
import "ant-design-vue/dist/reset.css";
import "@be/design-tokens/tokens.css";

import App from "./App.vue";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { refreshTokens } from "./api/iam";
import { bootstrapAfterAuth } from "./auth/bootstrap";
import { applyBeTheme } from "@be/ui-kit-pc";

const app = createApp(App);
const pinia = createPinia();
setActivePinia(pinia); // bootstrap() 下面几行在组件树挂载之前就要用 store，先手动激活
app.use(pinia);
app.use(VxeUIBase).use(VxeUITable);

applyBeTheme("light", "comfortable"); // 阶段三只落地"可运行时切"这个机制本身，界面上的切换器留给后续阶段（design.md §2）

/**
 * 刷新页面时如果本地还有 refresh token，先静默换回一个 access token，
 * 再挂路由——保证第一次路由解析时 `auth.isAuthenticated()`/`access` 的
 * 判定已经是最新的，不会因为"access token 还没换回来"而误判成未登录、
 * 把用户弹回登录页。
 */
async function bootstrap(): Promise<void> {
  const auth = useAuthStore();
  if (auth.refreshToken) {
    const ok = await refreshTokens();
    if (ok) {
      await bootstrapAfterAuth();
    }
  }
  app.use(router);
  app.mount("#app");
}

void bootstrap();
