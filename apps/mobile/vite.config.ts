import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import Uni from "@uni-helper/plugin-uni";

export default defineConfig({
  // component.yaml 只锁了一个端口/一份镜像（同 slot:frontend 族的既有约束，
  // 见 registry/ports.tsv 只给 frontend-standard 登记了一行）——PC 和移动端
  // 合用同一个 Nginx 容器，移动端挂在 /m/ 子路径下，见 Dockerfile 的
  // nginx.conf。uni-app 默认就是 hash 路由（真机验证过，浏览器地址栏是
  // `/#/pages/...`），子路径部署不需要额外的服务端 rewrite 规则。
  base: "/m/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [Uni()],
  server: {
    port: 5174,
    proxy: {
      "/api/iam": { target: "http://localhost:8200", changeOrigin: true },
      "/api/tenant": { target: "http://localhost:8200", changeOrigin: true },
      "/api/me": { target: "http://localhost:8223", changeOrigin: true },
      "/infra/workflow": { target: "http://localhost:8201", changeOrigin: true },
      "/infra/notification": { target: "http://localhost:8202", changeOrigin: true },
    },
  },
});
