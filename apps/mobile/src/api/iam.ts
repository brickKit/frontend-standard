/** 同 `apps/pc` 的 `api/iam.ts`——逐字对应 `infra-iam-casdoor` 契约。 */
import { getConfig } from "../config";
import { authState, setTokens, clearTokens, type TokenPair } from "../auth/state";
import { authedFetch } from "./http";

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(new URL(path, window.location.origin + getConfig().gatewayBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${path} 返回 ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function exchangeAppToken(casdoorIdToken: string): Promise<TokenPair> {
  const pair = await publicPost<TokenPair>("/api/iam/token", { casdoor_id_token: casdoorIdToken });
  setTokens(pair);
  return pair;
}

export async function refreshTokens(): Promise<boolean> {
  if (!authState.refreshToken) return false;
  try {
    const pair = await publicPost<TokenPair>("/api/iam/token/refresh", { refresh_token: authState.refreshToken });
    setTokens(pair);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = authState.refreshToken;
  clearTokens();
  if (!refreshToken) return;
  await fetch(new URL("/api/iam/logout", window.location.origin + getConfig().gatewayBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {});
}

export interface MyPermissions {
  keys: string[];
}

export async function fetchMyPermissions(): Promise<MyPermissions> {
  return authedFetch("/api/me/permissions") as Promise<MyPermissions>;
}
