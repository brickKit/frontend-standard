import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../src/config", () => ({ getConfig: () => ({ gatewayBaseUrl: "" }) }));

const refreshTokensMock = vi.fn();
vi.mock("../src/api/iam", () => ({ refreshTokens: () => refreshTokensMock() }));

import { authedFetch, ApiError } from "../src/api/http";
import { useAuthStore } from "../src/stores/auth";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function tokenStaleResponse(): Response {
  return new Response("", { status: 401, headers: { "WWW-Authenticate": 'Bearer error="token_stale"' } });
}

function plainUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "no token" }), { status: 401 });
}

describe("authedFetch：§3.4 第⑤步「只重试一次，防死循环」", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    refreshTokensMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("正常请求直接透传数据，不触发任何刷新", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await authedFetch("/api/whatever");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshTokensMock).not.toHaveBeenCalled();
  });

  it("token_stale 时刷新一次并重试原请求，刷新成功则返回重试后的数据", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenStaleResponse())
      .mockResolvedValueOnce(jsonResponse({ retried: true }));
    vi.stubGlobal("fetch", fetchMock);
    refreshTokensMock.mockResolvedValue(true);

    const result = await authedFetch("/api/whatever");

    expect(result).toEqual({ retried: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshTokensMock).toHaveBeenCalledTimes(1);
  });

  it("重试后仍然 token_stale 时不会再刷新第二次——防死循环是这条测试的核心", async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenStaleResponse()); // 每次都返回同样的 401 token_stale
    vi.stubGlobal("fetch", fetchMock);
    refreshTokensMock.mockResolvedValue(true); // 刷新本身"成功"，但下游仍然拒绝

    await expect(authedFetch("/api/whatever")).rejects.toBeInstanceOf(ApiError);

    // 第一次请求 + 刷新后重试一次 = 恰好 2 次 fetch，不是 3 次、不是无限
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshTokensMock).toHaveBeenCalledTimes(1);
  });

  it("刷新本身失败时直接清空登录态并抛错，不重试", async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenStaleResponse());
    vi.stubGlobal("fetch", fetchMock);
    refreshTokensMock.mockResolvedValue(false);

    const auth = useAuthStore();
    auth.setTokens({ access_token: "old", refresh_token: "old-refresh", token_type: "Bearer", expires_in: 600 });

    await expect(authedFetch("/api/whatever")).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1); // 没有重试
    expect(auth.accessToken).toBe(""); // 401 分支清空了登录态
  });

  it("普通 401（没有 token_stale 标记）不触发刷新，直接抛错", async () => {
    const fetchMock = vi.fn().mockResolvedValue(plainUnauthorizedResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(authedFetch("/api/whatever")).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshTokensMock).not.toHaveBeenCalled();
  });
});
