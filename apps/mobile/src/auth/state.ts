/**
 * 移动端只有两个页面组，用一个 reactive 单例就够，不引入 Pinia——同
 * `apps/pc` 一样：access token 只放内存，refresh token 放 localStorage
 * （见 `apps/pc/src/stores/auth.ts` 的同一条注释）。
 */
import { reactive } from "vue";

const REFRESH_TOKEN_KEY = "be.refreshToken";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authState = reactive({
  accessToken: "",
  tokenType: "Bearer",
  refreshToken: (typeof localStorage !== "undefined" && localStorage.getItem(REFRESH_TOKEN_KEY)) || "",
});

export function setTokens(pair: TokenPair): void {
  authState.accessToken = pair.access_token;
  authState.tokenType = pair.token_type;
  authState.refreshToken = pair.refresh_token;
  localStorage.setItem(REFRESH_TOKEN_KEY, pair.refresh_token);
}

export function clearTokens(): void {
  authState.accessToken = "";
  authState.refreshToken = "";
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return authState.accessToken !== "" || authState.refreshToken !== "";
}

export function authHeader(): string {
  return authState.accessToken ? `${authState.tokenType} ${authState.accessToken}` : "";
}
