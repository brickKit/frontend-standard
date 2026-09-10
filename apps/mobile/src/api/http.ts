/** 同 `apps/pc` 的 `api/http.ts`："只重试一次，防死循环"（design.md §3.4 第⑤步）。 */
import { getConfig } from "../config";
import { authHeader, clearTokens } from "../auth/state";
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
  return (resp.headers.get("WWW-Authenticate") ?? "").includes('error="token_stale"');
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

export async function authedFetch(path: string, init: RequestInit = {}, alreadyRetried = false): Promise<unknown> {
  const resp = await fetch(new URL(path, window.location.origin + getConfig().gatewayBaseUrl), {
    ...init,
    headers: { ...init.headers, authorization: authHeader() },
  });

  if (isTokenStale(resp) && !alreadyRetried) {
    const refreshed = await refreshTokens().catch(() => false);
    if (refreshed) return authedFetch(path, init, true);
  }

  if (resp.status === 401) {
    clearTokens();
    throw new ApiError(401, await parseBody(resp));
  }
  if (!resp.ok) {
    throw new ApiError(resp.status, await parseBody(resp));
  }
  return parseBody(resp);
}
