/**
 * 开发期默认值，`pnpm dev`/单元测试直接用。真机部署时这份文件会被
 * Docker 镜像的 entrypoint 用真实注入的 GATEWAY_BASE_URL/IAM_ISSUER_URL
 * 环境变量整个覆盖生成（见 Dockerfile + docker-entrypoint.sh）——
 * 这是纯静态 SPA 版的"configSchema 值怎么从平台传进来"：没有常驻进程
 * 能读 process.env，只能在容器启动时把值写进一份静态 JS 文件，让
 * index.html 在加载应用 bundle 之前先加载它。
 *
 * `casdoorClientId` 留空——它是本机 Casdoor 里 `brickkit-app` 这个 OIDC
 * 应用的 client_id，每次 `make up` 重新起 Casdoor 都可能不同（阶段三
 * Task 12 真机验证过完整登录链路用的是 `curl .../get-application` 现查
 * 出来的真实值，不是编出来的）。本机联调前用同样的方式查一次，填进来，
 * 不要提交真实值——它虽然不是密钥（public client 的 client_id 本身设计
 * 上就是公开的），但绑定的是这台机器当次的 Casdoor 实例，换一台机器/
 * 重新初始化后大概率对不上。
 */
window.__BE_CONFIG__ = {
  gatewayBaseUrl: "",
  iamIssuerUrl: "http://localhost:8000",
  casdoorClientId: "",
};
