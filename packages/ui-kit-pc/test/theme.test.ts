import { describe, expect, it } from "vitest";
import { getTheme, getConfig } from "vxe-table";
import { applyBeTheme } from "../src/theme";

describe("applyBeTheme：design-tokens 与 vxe 主题/密度必须同步切", () => {
  it("mode='dark' 时 --be-* 的 data-theme 与 vxe 的 data-vxe-ui-theme 同时变成 dark", () => {
    applyBeTheme("dark", "comfortable");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-vxe-ui-theme")).toBe("dark");
    expect(getTheme()).toBe("dark");
  });

  it("mode='light' 时两边一起切回 light", () => {
    applyBeTheme("dark", "comfortable");
    applyBeTheme("light", "comfortable");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-vxe-ui-theme")).toBe("light");
  });

  it("density='compact' 时 --be-* 的 data-density 与 vxe 的全局 size 同时变紧凑", () => {
    const result = applyBeTheme("light", "compact");
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
    expect(getConfig().size).toBe("small");
    expect(result.componentSize).toBe("small"); // 喂给 AntDV ConfigProvider 用
  });

  it("density='comfortable' 时两边都回到常规尺寸", () => {
    const result = applyBeTheme("light", "comfortable");
    expect(getConfig().size).toBe("medium");
    expect(result.componentSize).toBe("middle"); // AntDV 用 'middle' 不是 'comfortable'，两套命名不一样
  });
});
