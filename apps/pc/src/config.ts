export interface BeRuntimeConfig {
  gatewayBaseUrl: string;
  /** Casdoor 自己的公网 base URL——浏览器直连用（design.md §3.4 第①步），不经网关。 */
  iamIssuerUrl: string;
  /** Casdoor 里这个 OIDC 应用的 client_id，public client，公开值不是密钥（design.md §9 第 5 条）。 */
  casdoorClientId: string;
}

declare global {
  interface Window {
    __BE_CONFIG__?: BeRuntimeConfig;
  }
}

/** 唯一的配置读取入口，模块代码里不直接摸 `window.__BE_CONFIG__`（同 besdk 的 `rt.Config` 心智模型）。 */
export function getConfig(): BeRuntimeConfig {
  const cfg = window.__BE_CONFIG__;
  if (!cfg) {
    throw new Error("window.__BE_CONFIG__ 未注入：public/config.js 没有在 index.html 里正确加载");
  }
  return cfg;
}
