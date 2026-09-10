# @be/ui-kit-mobile

移动端第三方组件的接线位置（决策 111）——但跟 `ui-kit-pc` 不是同一种"只许出现在这里"的落地方式，原因如下。

## 跟 PC 端不一样的地方，如实记录

`ui-kit-pc` 把 AntDV/vxe-table 包一层是因为 PC 端用的是**显式 `import`**
（`import { Button } from "ant-design-vue"`），业务页面一旦直接写这行，换库时要
改几十个文件。

`wot-design-uni` 走的是 uni-app 自己的 **easycom** 机制：`wd-button`/`wd-cell`
这些标签**不需要任何 `import` 语句**，编译器按标签名前缀自动注册（见
`apps/mobile/pages.json` 的 `easycom.custom` 配置）。业务页面模板里写
`<wd-button>`，没有一行"要挪到 ui-kit-mobile 里"的 import 代码——挪的对象根本
不存在。真要换成另一个 uni-app 组件库，付出的代价是**改每个页面的标签名**，
跟有没有一层包装组件无关（除非把 70+ 个组件全部重新包一遍，对本阶段两个页面组
——待办、通知——完全不成比例）。

所以本包目前只做一件事，跟 PC 端"两件一次性接线活"里那件更小的一件对应：

## 唯一职责：主题 CSS 变量桥接

`src/theme.css` 把 `wot-design-uni` 的 `--wot-*` 变量指向 `@be/design-tokens`
的 `--be-*`，主题只有一处真相源（同 `ui-kit-pc/src/theme.ts` 的注释）。
`apps/mobile` 的入口文件 `import "@be/ui-kit-mobile"` 一次即可。

## 逃生口清单

这里记的不是"绕开某个包装组件"（本包没有包装组件），而是**换供应商時要改的面**：
业务页面里出现的每一种 `wd-*` 标签都是这个面的一部分。目前用到的组件（`wd-button`/
`wd-cell`/`wd-tag`/`wd-loadmore`/`wd-navbar`/`wd-empty`/`wd-textarea`/`wd-popup`）
都是 wot-design-uni 的标准组件，没有走它的高级定制 API，换库时逐个标签替换即可，
这份清单同样"必须数得清"：

| 组件标签 | 出现在哪些页面 |
|---|---|
| `wd-navbar` | 所有页面的顶部标题栏 |
| `wd-cell`/`wd-cell-group` | 待办列表、通知列表 |
| `wd-tag` | 待办状态、通知状态 |
| `wd-button` | 待办详情的同意/驳回、登录页 |
| `wd-textarea` | 待办详情的驳回附言 |
| `wd-popup` | 驳回附言的弹层 |
| `wd-loadmore` | 列表页的"加载更多" |
| `wd-status-tip` | 空列表状态 |
| `wd-loading` | 登录跳转中的等待态 |
