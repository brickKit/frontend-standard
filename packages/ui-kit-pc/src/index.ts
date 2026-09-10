import "./renderers"; // 副作用：把 AntDV 控件注册成 vxe 全局渲染器（§12.6.2）

export { default as BeTable } from "./components/BeTable.vue";
export type { BeTableProps } from "./components/BeTable.vue";

export { default as BeListPage } from "./pages/BeListPage.vue";
export { default as BeDetailPage } from "./pages/BeDetailPage.vue";
export { default as BeFormPage } from "./pages/BeFormPage.vue";
export { default as BeSettingsPage } from "./pages/BeSettingsPage.vue";

export { applyBeTheme, beAntdThemeConfig, type AntdComponentSize } from "./theme";
