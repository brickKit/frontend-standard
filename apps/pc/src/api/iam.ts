/**
 * `infra-iam-casdoor` 的三个 `besdk.Public` 端点（换 token/刷新/features）+
 * 一个需要登录的登出端点。都经网关，路径与 design.md §3 契约表逐字对应。
 */
import { getConfig } from "../config";
import { useAuthStore, type TokenPair } from "../stores/auth";
import { authedFetch } from "./http";

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(new URL(path, window.location.origin + getConfig().gatewayBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`${path} 返回 ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

/** design.md §3.4 第③步：拿 Casdoor id_token 换应用 token。 */
export async function exchangeAppToken(casdoorIdToken: string): Promise<TokenPair> {
  const pair = await publicPost<TokenPair>("/api/iam/token", { casdoor_id_token: casdoorIdToken });
  useAuthStore().setTokens(pair);
  return pair;
}

/**
 * §3.4 第⑤步用的刷新。返回 `false`（而不是抛异常）代表"刷新本身失败，
 * 该登出了"——`authedFetch` 靠这个布尔值决定要不要把 401 直接往上抛，
 * 不靠 catch 一个特定异常类型区分"网络错误"与"refresh token 确实失效"
 * 这两种在这里被刻意合并处理（都是"没法再续"）。
 */
export async function refreshTokens(): Promise<boolean> {
  const auth = useAuthStore();
  if (!auth.refreshToken) return false;
  try {
    const pair = await publicPost<TokenPair>("/api/iam/token/refresh", { refresh_token: auth.refreshToken });
    auth.setTokens(pair);
    return true;
  } catch {
    auth.clear();
    return false;
  }
}

export async function logout(): Promise<void> {
  const auth = useAuthStore();
  const refreshToken = auth.refreshToken;
  auth.clear();
  if (!refreshToken) return;
  await fetch(new URL("/api/iam/logout", window.location.origin + getConfig().gatewayBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {
    // 登出接口幂等，前端已经清了本地状态；网络失败不阻塞用户离开登录态
  });
}

export interface TenantFeatures {
  enabled_components: string[];
}

/** §3.3：`besdk.Public`，还没登录就要用它决定渲染什么，所以不带 Authorization。 */
export async function fetchTenantFeatures(): Promise<TenantFeatures> {
  const resp = await fetch(new URL("/api/tenant/features", window.location.origin + getConfig().gatewayBaseUrl));
  if (!resp.ok) throw new Error(`/api/tenant/features 返回 ${resp.status}`);
  return resp.json() as Promise<TenantFeatures>;
}

export interface MyPermissions {
  keys: string[];
}

export async function fetchMyPermissions(): Promise<MyPermissions> {
  return authedFetch("/api/me/permissions") as Promise<MyPermissions>;
}
