# @be/ui-kit-pc

PC 端第三方组件的唯一入口（决策 111、§12.6.3）：`ant-design-vue` + `vxe-table` 只许出现在这个包里，
业务页面（`apps/pc/src/pages/**`）一律用这里导出的组件名，不直接 `import` 第三方库——换实现只改这一个包，
不用改几十个页面。

## 导出什么

| 导出 | 是什么 | 覆盖场景 |
|---|---|---|
| `BeTable` | `<vxe-grid>` 的封装，见组件内注释 | 列表页的表格主体，覆盖 ~80% 用法（§12.6.6 判据） |
| `BeListPage` / `BeDetailPage` / `BeFormPage` / `BeSettingsPage` | 页面级模板（决策 113） | 见 `src/pages/`，业务页面从这几个起手，不从空白 `<div>` 摆布局 |
| `applyBeTheme(mode, density)` | 主题/密度切换的唯一入口 | 同时驱动 `@be/design-tokens` 的 CSS 变量与 vxe 自己的 `data-vxe-ui-theme`/全局 size 配置 |
| `beAntdThemeConfig` | 喂给 `<a-config-provider :theme="...">` 的常量 | 颜色类 token 全部引用 `var(--be-*)`，主题只有一处真相源 |

## 两件一次性接线活（§12.6.2），已经做完，不用再做第二次

1. **AntDV token → vxe CSS 变量**：`src/theme.ts` 的 `beAntdThemeConfig`。
2. **AntDV 控件 → vxe 全局渲染器**：`src/renderers.ts`，`import "./renderers"` 的副作用注册了
   `BeInput`/`BeInputNumber`/`BeSelect`/`BeDatePicker` 四个渲染器名，`<BeTable>` 的可编辑列直接写
   `editRender: { name: "BeInput" }` 即可，渲染出来的是真的 `<a-input>`。

## 装机注意（真机踩过的坑，见根 `docs/dev/实测踩坑记录.md` A12）

`vxe-table@4.x` 把表格逻辑和实际 UI 组件（按钮/提示等）拆成了 `vxe-table` + `vxe-pc-ui` 两个包，
`apps/pc/src/main.ts` 必须两个都 `app.use()`：

```ts
import VxeUIBase from "vxe-pc-ui";
import "vxe-pc-ui/lib/style.css";
import VxeUITable from "vxe-table";
import "vxe-table/lib/style.css";

app.use(VxeUIBase).use(VxeUITable);
```

漏装的症状不是报错，是"表体、工具栏按钮全部静默不渲染"，控制台只有一行容易扫过去的警告。

## 逃生口清单（§12.6.6 判据："这份清单必须数得清"）

业务页面绕开 `BeTable`/页面模板、直接用 `vxe-grid`/`vxe-table`/`ant-design-vue` 原生组件时，在这里记一行：
页面、绕开了什么、为什么 `BeTable` 覆盖不了。**这份清单目前是空的**——阶段三 Task 12 的业务页面全部
通过 `<BeTable>` 暴露的 `grid` ref（逃生口本身内建在组件里，见 `BeTable.vue` 的 `defineExpose`）或页面模板
覆盖，没有出现过需要绕开的场景。

| 页面 | 绕开了什么 | 为什么 |
|---|---|---|
| （暂无） | | |
