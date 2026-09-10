export interface BeRuntimeConfig {
  gatewayBaseUrl: string;
  iamIssuerUrl: string;
  casdoorClientId: string;
}

declare global {
  interface Window {
    __BE_CONFIG__?: BeRuntimeConfig;
  }
}

/** 唯一的配置读取入口，同 `apps/pc` 的既有约定（§12.5.3 心智模型的前端版）。 */
export function getConfig(): BeRuntimeConfig {
  const cfg = window.__BE_CONFIG__;
  if (!cfg) {
    throw new Error("window.__BE_CONFIG__ 未注入：public/config.js 没有在 index.html 里正确加载");
  }
  return cfg;
}
