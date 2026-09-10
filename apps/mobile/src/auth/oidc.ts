/**
 * 浏览器 ↔ Casdoor 的标准 OIDC 授权码 + PKCE 流程，与 `apps/pc` 的
 * `src/auth/oidc.ts` 逻辑一致（真机验证过完整链路，见阶段三 Task 12
 * 小节）——两端各自独立一份而不是共享包，同"两端不共享组件只共享
 * design-tokens"的既有架构决定（decision 111）一致，这份文件足够小，
 * 独立维护的成本低于抽一个共享包的成本。差异只有 `redirectUri` 指向
 * 移动端自己的 `/pages/callback/index`。
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

export async function exchangeCasdoorCode(params: OidcParams, query: URLSearchParams): Promise<{ idToken: string }> {
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
