# frontend-standard · AI 助手导读

## 身份证

| 项 | 值 |
|---|---|
| 组件 ID | `frontend/standard` |
| 仓库名 | `frontend-standard` |
| 端口 | `80`（无 gRPC），`exposePort=28090`（`registry/ports.tsv`） |
| schema / role | **无**（前端无数据库） |
| 语言 / 框架 | TypeScript：PC = 独立 Vite SPA（Vue3 + Ant Design Vue v4 + vxe-table）；移动端 = Uni-app（Vue3 + wot-design-uni，H5 target） |
| 合并部署时进 | **不进外壳，独立 Nginx 容器**（§13.5：Nginx 合不进来） |
| 装配角色 | `slot:frontend` 的 `default` 成员（族内 `advanced`/`{industry}`/`{customer}` 三个成员共用 80 端口、槽位互斥、永不共存） |
| 设计真相源 | 装配仓库 `docs/design/frontend-standard.md`——本文件与它冲突时，以那份为准，回来改这里 |

## 边界

**归我：**

- PC + 移动端的展示与交互，两端**共享 `packages/design-tokens`，不共享组件**（决策 111）
- 按装配与权限动态注册路由与菜单：`features ∩ permissions`（design.md §3.3）
- 登录回调与 token 交换的前端那一半：Casdoor 回调 → 换应用 token → 存起来 → 静默刷新

**不归我：**

| 什么 | 归谁 | 为什么 |
|---|---|---|
| 任何核心商业逻辑（价格、库存防超卖、信用额度） | 后端组件 | §8.4 铁律，前端要试算必须调后端 `DryRun` |
| 权限的判定 | 后端 `be-sdk` | 前端只决定"要不要显示"，从来不是安全边界——真机验证过：即使把 `/api/me/permissions` 的响应 mock 成"有权限"，erp-sales 依然会用真实 JWT 的角色独立判定并正确 403 |
| 复杂跨域聚合 | `infra-bff-mobile` | 我做客户端聚合（并发几个 REST 请求再拼），它做服务端聚合（一个 GraphQL 查询） |
| 打印渲染 | `infra-print` | 我拿到 PDF 字节流负责展示/下载 |
| 认证本身 | Casdoor | 账密/微信/QQ/Google 全在它的登录页，浏览器直连，我不代理 |

**`data_scopes: none`**（design.md §2.2 要求显式写）——前端无数据库。

## 契约面与事件

**对外：无 API。** 纯静态资源（Nginx 托管构建产物）。

**我调用的**：各业务组件的 REST（经网关）、`infra-bff-mobile` 的 GraphQL（经网关，复杂页面用）、
`infra-iam-casdoor` 的 token/features 端点（经网关）、Casdoor 的登录/token 端点（浏览器直连，
**不经网关**）。完整清单见 `docs/手册.md` §3。

**发布/消费事件：都没有。** 不接事件总线（design.md §4）。

## 依赖与「为什么不依赖某某」

`component.yaml` 的 `dependencies.components` 永远是空数组——**前端只认网关**，后端装了
哪些通过运行时的 `/api/tenant/features` 得知，不是靠平台的依赖解析。

⚠️ **建了依赖边反而会坏事**：平台会因为某个后端组件没装而阻断前端启动，而前端本该在
任何装配组合下都能起来。

## 这个组件特有的坑

| 不许 | 症状 | 出处 |
|---|---|---|
| 业务页面（`apps/pc/src/pages/**`、`apps/pc/src/layouts/**`）直接 `import` `vxe-table`/`vxe-pc-ui` | 换表格引擎要改几十个页面而不是一个文件——`make import-scan` 会拦，但手滑时先自己看一眼 | `packages/ui-kit-pc/src/components/BeTable.vue` 顶部注释、决策 111 |
| 给某个"可选 boolean prop"的 Vue 组件写 `defineProps<{ x?: boolean }>()` 却不配 `withDefaults` | Vue 编译器会给纯类型声明的可选 boolean prop 隐式推出 `default: false`，"不传等于 undefined"的直觉是错的——真机踩过（`BeDetailPage.vue` 的 `showBack`），见根 `docs/dev/实测踩坑记录.md` A13 | `packages/ui-kit-pc/src/pages/BeDetailPage.vue` |
| `<BeTable>` 的可编辑列/行点击接 `vxe-grid` 的 `cell-click` 走"未声明 emit 自动穿透到唯一根节点"这条 Vue 机制 | 真机 + 单测都验过：穿透到位不代表 vxe 内部真的会触发对应事件（它的点击判定是内部逻辑，不是原生 DOM click 转发），必须在 `BeTable.vue` 内显式接 `@cell-click` 再转成语义化的 `row-click` 自定义事件 | `packages/ui-kit-pc/src/components/BeTable.vue` 的 `onCellClick` 注释 |
| 列表页/详情页的 `load()`/`reload()` 只写 `try { ... } finally { ... }`，不写 `catch` | 后端拒绝（403/500）是**正常路径**（§14.1.8："前端判定不是安全边界"），不写 catch 会变成未捕获的 Promise rejection，页面停在空白态且用户看不到任何提示——真机浏览器测试踩出来的，见根 `docs/dev/实测踩坑记录.md` A14 | 全部 `apps/pc/src/pages/**`、`apps/mobile/src/pages/**` |
| `apps/mobile` 的 `index.html` 用 `<script src="/config.js">` 引用一份独立的运行时配置文件（`apps/pc` 的既有模式） | uni-app 的 Vite 插件（`@uni-helper/plugin-uni`）在 dev 模式下会把 `index.html` 里所有 `<script src>` 都当模块请求预处理，跟 Vite "public 目录文件不许被当模块 import"的规则冲突，报 500——生产构建不受影响，只在本地 `pnpm dev` 复现，见根 `docs/dev/实测踩坑记录.md` A15 | `apps/mobile/index.html`（改成内联 `<!-- BE_CONFIG_START/END -->` 占位） |
| 给 `apps/mobile` 单独锁一个跟 `apps/pc`/两个 `ui-kit-*` 包不一样的 `vue` 精确版本 | 同一个 pnpm workspace 里两个应用各自锁不同 vue 版本，会让 `vue-tsc` 的类型检查程序把两边的 `@vue/runtime-core` 类型声明都摄入同一个环境，`vxe-table`/`vxe-pc-ui` 的 `install()` 参数类型对不上——真实 Docker 构建复现过，见根 `docs/dev/实测踩坑记录.md` A16 | `apps/mobile/package.json` 的 `vue` 版本必须跟其余包保持一致（当前 `3.5.42`） |
| 给移动端页面 `import` `wot-design-uni` 这个 npm 包 | 组件走 uni-app 的 easycom 机制（`wd-*` 标签按前缀自动注册，见 `pages.json` 的 `easycom.custom`），不需要、也不该有 `import` 语句——`make import-scan` 会拦这个 | `packages/ui-kit-mobile/README.md` |
| 假设 `packages/design-tokens` 需要先在 `packages/ui-kit-pc`/`ui-kit-mobile` 编译好才能用 | `ui-kit-pc`/`ui-kit-mobile` 是直接引用 `src/`（just-in-time 工作区包），**只有 `design-tokens` 自己需要真的 `pnpm build`**——它被两端的运行时（不只是类型）都引用了编译后的 CSS/JS | `docs/手册.md` §1、根 `package.json` 的 `build` 脚本 |

## 改代码前的自查

1. **我是不是在业务页面里直接 `import` `vxe-table`/`vxe-pc-ui`/`wot-design-uni`？** 停下——
   表格走 `<BeTable>`，移动端组件走 easycom 标签，都不需要业务代码里出现这些 import。
2. **我写的 Vue 组件是不是有一个"不传就该默认 true"的可选 boolean prop？** 检查是不是配了
   `withDefaults`——不配的话编译器会悄悄把默认值定成 `false`。
3. **我新加的 `load()`/`reload()` 函数是不是漏了 `catch`？** 后端拒绝是正常路径，必须给
   用户一个可见的失败反馈，不能让它变成一条静默的 Vue 警告。
4. **我是不是在给 `apps/mobile` 单独调整 `vue` 版本？** 停下——必须跟工作区其余包保持
   完全一致的精确版本，否则会在类型检查阶段互相污染。
5. **我加的这个菜单项，`componentId`/`permission` 是不是照抄了对应组件真实的
   `assembly.yaml`？** 不是的话停下去查——`registry/permissions.tsv` 可能滞后，
   `assembly.yaml` 才是真相源。
6. **这个改动会不会让某个 `load()`/`reload()` 函数在没有真实后端可用时崩溃而不是优雅降级？**
   真机浏览器测试（而不是只看类型检查）才测得出来这一类问题。
