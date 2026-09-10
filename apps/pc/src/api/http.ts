/**
 * 经网关的统一请求入口。§3.4 第⑤步："只重试一次，防死循环"——这是
 * 必须实现的防线，不是优化，所以这里用一个显式的 `alreadyRetried`
 * 参数做递归调用的守卫，而不是指望调用方自己记着别再调一次。
 */
import { getConfig } from "../config";
import { useAuthStore } from "../stores/auth";
import { refreshTokens } from "./iam";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API 请求失败：HTTP ${status}`);
  }
}

function isTokenStale(resp: Response): boolean {
  if (resp.status !== 401) return false;
  const wwwAuth = resp.headers.get("WWW-Authenticate") ?? "";
  return wwwAuth.includes('error="token_stale"');
}

async function parseBody(resp: Response): Promise<unknown> {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** 需要登录态的请求。公开接口（换 token、features）直接用 `fetch` + `getConfig().gatewayBaseUrl`，不走这个函数。 */
export async function authedFetch(path: string, init: RequestInit = {}, alreadyRetried = false): Promise<unknown> {
  const auth = useAuthStore();
  const resp = await fetch(new URL(path, window.location.origin + getConfig().gatewayBaseUrl), {
    ...init,
    headers: { ...init.headers, authorization: auth.authHeader() },
  });

  if (isTokenStale(resp) && !alreadyRetried) {
    const refreshed = await refreshTokens().catch(() => false);
    if (refreshed) {
      return authedFetch(path, init, true); // 只重试这一次，第二次 401 直接往下走到"抛错"分支
    }
  }

  if (resp.status === 401) {
    auth.clear();
    throw new ApiError(401, await parseBody(resp));
  }

  if (!resp.ok) {
    throw new ApiError(resp.status, await parseBody(resp));
  }

  return parseBody(resp);
}
