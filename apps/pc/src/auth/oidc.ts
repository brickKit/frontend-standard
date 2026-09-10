/**
 * 浏览器 ↔ Casdoor 的标准 OIDC 授权码 + PKCE 流程（design.md §3.4 第①②步）。
 * ⚠️ 这一步完全不经过我们任何后端——`redirectToLogin`/`exchangeCasdoorCode`
 * 两个函数直接打 `casdoorBaseUrl`（真实的 Casdoor 实例），不走 `gatewayBaseUrl`。
 * 换回来的 Casdoor id_token 才在 §3 第③步喂给我们自己的
 * `POST /api/iam/token`（那一步才经网关，见 `api/iam.ts`）。
 *
 * PKCE 而不是 client_secret：SPA 是 public client，密钥没有安全存放的
 * 地方（打包进 bundle 等于公开），Casdoor 官方文档确认 public client
 * 走 `code_challenge_method=S256` 保护授权码本身，不需要 client_secret
 * （design.md §9 第 5 条）。
 */
const CODE_VERIFIER_KEY = "be.oidc.codeVerifier";
const STATE_KEY = "be.oidc.state";

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

export interface OidcParams {
  casdoorBaseUrl: string;
  clientId: string;
  redirectUri: string;
}

/** 未登录访问时调用：整页跳转到 Casdoor，函数本身不返回（浏览器已经离开）。 */
export async function redirectToLogin(params: OidcParams): Promise<void> {
  const codeVerifier = randomString(32);
  const state = randomString(16);
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STATE_KEY, state);

  const codeChallenge = base64url(await sha256(codeVerifier));

  const url = new URL("/login/oauth/authorize", params.casdoorBaseUrl);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.assign(url.toString());
}

export class OidcCallbackError extends Error {}

/**
 * `/callback` 路由拿到 `?code=&state=` 后调用：换回 Casdoor 的 id_token。
 * ✅ 已用真实 Casdoor 实例（本机 `make up` 起的 `be-casdoor`）+ Playwright
 * 真机浏览器测试跑通完整链路（阶段三 Task 12）：`/login/oauth/authorize`
 * 的 PKCE 参数、`/api/login/oauth/access_token` 这个端点路径与请求体
 * 字段，全部核对过是真实生效的，不是照文档猜的。
 */
export async function exchangeCasdoorCode(
  params: OidcParams,
  query: URLSearchParams,
): Promise<{ idToken: string }> {
  const returnedState = query.get("state");
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const code = query.get("code");
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);

  if (!code || !returnedState || !expectedState || returnedState !== expectedState || !codeVerifier) {
    throw new OidcCallbackError("OIDC 回调参数缺失或 state 不匹配，可能是 CSRF 或会话过期");
  }

  const resp = await fetch(new URL("/api/login/oauth/access_token", params.casdoorBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: params.clientId,
      code,
      redirect_uri: params.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!resp.ok) {
    throw new OidcCallbackError(`Casdoor 换 token 失败：HTTP ${resp.status}`);
  }
  const body = (await resp.json()) as { id_token?: string; access_token?: string };
  const idToken = body.id_token ?? body.access_token;
  if (!idToken) {
    throw new OidcCallbackError("Casdoor 响应里没有 id_token/access_token 字段");
  }
  return { idToken };
}
