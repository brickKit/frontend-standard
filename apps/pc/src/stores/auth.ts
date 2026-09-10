/**
 * §3.4：登录与静默刷新。access token 只放内存（Pinia state，刷新页面即丢），
 * refresh token 放 localStorage（长期存活，靠它在页面刷新后静默换回一个
 * 新的 access token）——不把 access token 也丢进 localStorage，缩小 XSS
 * 场景下的暴露面；这份契约本身走 JSON body 而不是 httpOnly cookie
 * （见 `docs/design/frontend-standard.md` §3.4，Casdoor 之后的应用
 * token 是 `infra-iam-casdoor` 自己签发返回的，不是网关种 cookie），
 * 所以前端确实要自己管这份存储，这是能做到的最小暴露面选择。
 */
import { defineStore } from "pinia";
import { ref } from "vue";

const REFRESH_TOKEN_KEY = "be.refreshToken";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string>("");
  const tokenType = ref<string>("Bearer");
  const refreshToken = ref<string>(localStorage.getItem(REFRESH_TOKEN_KEY) ?? "");

  function setTokens(pair: TokenPair): void {
    accessToken.value = pair.access_token;
    tokenType.value = pair.token_type;
    refreshToken.value = pair.refresh_token;
    localStorage.setItem(REFRESH_TOKEN_KEY, pair.refresh_token);
  }

  function clear(): void {
    accessToken.value = "";
    refreshToken.value = "";
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  function isAuthenticated(): boolean {
    return accessToken.value !== "" || refreshToken.value !== "";
  }

  function authHeader(): string {
    return accessToken.value ? `${tokenType.value} ${accessToken.value}` : "";
  }

  return { accessToken, tokenType, refreshToken, setTokens, clear, isAuthenticated, authHeader };
});
