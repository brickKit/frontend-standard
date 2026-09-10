/**
 * §12.6.2 的两件一次性接线活之一：把 AntDV 的 token 派生成 vxe 的 CSS 变量，
 * 主题只有一处真相源（`@be/design-tokens` 的 `--be-*` 变量）。
 *
 * 两条真实核对过的机制（不是猜的，读了 node_modules 里 ant-design-vue@4.2.6
 * 与 vxe-table@4.21.9/@vxe-ui/core@4.4.21 的源码）：
 *  1. vxe 的主题开关是 `document.documentElement` 上的 `data-vxe-ui-theme`
 *     属性（"light"/"dark"），配套的 CSS 变量前缀是 `--vxe-ui-*`
 *     （见 vxe-table/styles/theme/{light,dark}.scss）。`setTheme()` 是
 *     `@vxe-ui/core` 真实导出的函数，不是我们自己拼的。
 *  2. AntDV v4 的 ConfigProvider `theme.token` 可以直接塞 `var(--be-*)`
 *     这种 CSS 变量字符串（antd v5 系 token 系统允许 token 值是任意合法
 *     CSS 值），于是颜色类 token 不需要 JS 侧感知亮暗切换——CSS 变量
 *     本身已经在 `[data-theme="dark"]` 下换了值。
 *
 * ⚠️ 密度（compact/comfortable）不能靠 CSS 变量覆盖 AntDV 的 `controlHeight`
 * 这类数值 token——AntDV 内部用它做算术派生出 small/large 等梯度，塞字符串
 * 会破坏派生。真实的密度杠杆是 AntDV 自己的 `componentSize` 与 vxe 自己的
 * `VxeUI.setConfig({ size })`，两边各自有一条全局尺寸开关，见 `applyBeTheme`。
 */

import { setTheme as setVxeTheme, setConfig as setVxeConfig } from "vxe-table";
import type { ThemeConfig } from "ant-design-vue/es/config-provider/context";
import { applyDensity, applyTheme, type Density, type ThemeMode } from "@be/design-tokens";

/** 喂给 `<a-config-provider :theme="beAntdThemeConfig">` 的常量配置，颜色全部引用 --be-* 变量。 */
export const beAntdThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: "var(--be-color-brand)",
    colorSuccess: "var(--be-color-success)",
    colorWarning: "var(--be-color-warning)",
    colorError: "var(--be-color-danger)",
    colorInfo: "var(--be-color-info)",
    colorBgContainer: "var(--be-color-surface)",
    colorBgElevated: "var(--be-color-surface-raised)",
    colorBgLayout: "var(--be-color-bg)",
    colorText: "var(--be-color-text-primary)",
    colorTextSecondary: "var(--be-color-text-secondary)",
    colorTextDisabled: "var(--be-color-text-disabled)",
    colorBorder: "var(--be-color-border)",
    borderRadius: 8,
    fontSize: 14,
  },
};

const DENSITY_TO_ANTD_SIZE = { comfortable: "middle", compact: "small" } as const;
const DENSITY_TO_VXE_SIZE = { comfortable: "medium", compact: "small" } as const;

export type AntdComponentSize = (typeof DENSITY_TO_ANTD_SIZE)[Density];

/**
 * 应用主题的唯一入口：同时驱动 `@be/design-tokens`（写 CSS 变量）与
 * vxe-table 自己的 `data-vxe-ui-theme` 属性 + 全局 size 配置。
 * 返回 AntDV `<a-config-provider>` 该用的 `componentSize`，因为 AntDV
 * 没有 vxe 那种"设一个全局态就生效"的 API，componentSize 必须作为
 * prop 传下去。
 */
export function applyBeTheme(mode: ThemeMode, density: Density): { componentSize: AntdComponentSize } {
  applyTheme(mode);
  applyDensity(density);

  // vxe 的 setTheme 只认 'light'/'dark'，'system' 要先解析成实际值——
  // 复用 design-tokens 写完 DOM 后再读回来，不在这里重复实现一遍
  // matchMedia 判断逻辑（唯一真相源）。
  const resolved = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
  setVxeTheme(resolved ?? "light");
  setVxeConfig({ size: DENSITY_TO_VXE_SIZE[density] });

  return { componentSize: DENSITY_TO_ANTD_SIZE[density] };
}
