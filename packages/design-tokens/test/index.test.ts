import { describe, expect, it, beforeEach, vi } from "vitest";
import { applyTheme, applyDensity, getAppliedTheme, getAppliedDensity } from "../src/index.js";

describe("design-tokens 运行时切换", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-density");
  });

  it("applyTheme('dark') 直接写 data-theme=dark", () => {
    applyTheme("dark");
    expect(getAppliedTheme()).toBe("dark");
  });

  it("applyTheme('light') 直接写 data-theme=light", () => {
    applyTheme("light");
    expect(getAppliedTheme()).toBe("light");
  });

  it("applyDensity('compact') 写 data-density=compact，不影响 data-theme", () => {
    applyTheme("light");
    applyDensity("compact");
    expect(getAppliedDensity()).toBe("compact");
    expect(getAppliedTheme()).toBe("light");
  });

  it("applyTheme('system') 按 matchMedia 解析出实际值，且系统变化时真的更新 DOM", () => {
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    let matches = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      },
    }));

    applyTheme("system");
    expect(getAppliedTheme()).toBe("light");

    // 模拟系统切到暗色：不是重新调用 applyTheme，是触发订阅的 change 回调，
    // 验证的是"订阅确实生效"，不是"resolveTheme 这个纯函数算对了"。
    matches = true;
    listeners.forEach((cb) => cb({ matches: true }));
    expect(getAppliedTheme()).toBe("dark");

    vi.unstubAllGlobals();
  });

  it("再次调用 applyTheme 会先取消上一次的 system 订阅，不会重复监听", () => {
    const removeSpy = vi.fn();
    const addSpy = vi.fn();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: addSpy,
      removeEventListener: removeSpy,
    }));

    applyTheme("system");
    applyTheme("light"); // 切走：应该调用一次 removeEventListener 清理上一次的订阅

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
