import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

/**
 * `gatewayBaseUrl` 是装配期配置（component.yaml 的 configSchema），
 * 构建产物不能把它编译死——真实值由 Nginx 反代 + 运行时注入的
 * `window.__BE_CONFIG__`（见 `index.html`/`src/config.ts`）决定，
 * 不是这里的 Vite `define`。
 *
 * 这里配的是开发期代理：本地 `brickkit up` 起的容器各自独立暴露端口
 * （没有 Traefik 给 `frontend-standard` 配路由——这个组件还没接入
 * `brickkit.yaml`），所以按真实 REST 前缀分别代理到各组件的真实宿主机
 * 端口（`docker port` 核实过，见阶段三 Task 12 真机验证记录），效果
 * 等价于生产环境网关会做的路径路由。`/api/iam`、`/api/tenant` 走
 * `infra-iam-casdoor`；`/api/me`、`/api/admin` 走 `infra-authz`——
 * 两者共享 `/api` 前缀但下一段不同，必须分开配，写成一条大而化之的
 * `/api` 代理会把 authz 的请求也送去 iam-casdoor。
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api/iam": { target: "http://localhost:8200", changeOrigin: true },
      "/api/tenant": { target: "http://localhost:8200", changeOrigin: true },
      "/api/me": { target: "http://localhost:8223", changeOrigin: true },
      "/api/admin": { target: "http://localhost:8223", changeOrigin: true },
      "/mdm/customer": { target: "http://localhost:8080", changeOrigin: true },
      "/mdm/product": { target: "http://localhost:8082", changeOrigin: true },
      "/erp/sales": { target: "http://localhost:8084", changeOrigin: true },
      "/erp/inventory": { target: "http://localhost:8086", changeOrigin: true },
      "/erp/finance": { target: "http://localhost:8087", changeOrigin: true },
      "/infra/workflow": { target: "http://localhost:8201", changeOrigin: true },
      "/infra/notification": { target: "http://localhost:8202", changeOrigin: true },
      "/infra/print": { target: "http://localhost:8400", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
