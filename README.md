# frontend-standard

BrickEnterprise 标准前端：PC（Vue3 独立 SPA）+ 移动端（Uni-app H5），共用一份运行时可切换的
design-tokens。装配角色 `slot:frontend` 的 `default` 成员——同一环境只能装这一族里的一个。

## 它能做什么

- **PC 端**：AWS Console 式两级导航骨架（服务选择器+收藏栏、组织/法人切换器、⌘K 全局搜索、
  应用内标签页）+ 本阶段范围内的业务页面：销售订单（确认/发货/打印送货单）、我的待办
  （同意/驳回）、通知中心（历史+通道偏好）、角色管理（含给人授角色）、客户/产品/库存/应收
  只读查询。
- **移动端**：待办（列表+详情，同意/驳回）、通知（历史列表）——design.md §1.1 明确移动端
  只做这两块，不做建单。
- **登录**：真实 Casdoor 标准 OIDC + PKCE 授权码流程，换应用 token，401 `token_stale` 时
  静默刷新并重试原请求一次（真机联调过完整链路，见 `docs/design/frontend-standard.md`）。
- **动态路由/菜单**：`features ∩ permissions`——装了没有 (`/api/tenant/features`) 交上
  这个人能不能 (`/api/me/permissions`)，两者都要判（导读第 20 条）。

## 需要哪些基础资源

**无**。前端不连数据库、不接事件总线，`data_scopes: none`（design.md §2）。运行时只需要
能访问到网关后面的各业务组件 REST 面，与一个真实 Casdoor 实例（浏览器直连，不经网关）。

## 怎么起来

```bash
pnpm install
pnpm --filter @be/design-tokens build   # 必须先构建，其余包引用它编译产物
pnpm dev                                 # PC，默认 http://localhost:5173
pnpm dev:mobile                          # 移动端 H5，默认 http://localhost:5174
```

本地联调前，把 `apps/pc/public/config.js` 与 `apps/mobile/index.html` 里
`window.__BE_CONFIG__` 的 `iamIssuerUrl`/`casdoorClientId` 换成本机真实 Casdoor 的地址与
`brickkit-app`（或对应装配的）OIDC 应用 `client_id`（`curl` Casdoor 管理 API 的
`get-application` 现查，不要把真实值提交进仓库）。`vite.config.ts` 里的开发期代理已经把
各组件的真实契约前缀（`/mdm/customer`、`/erp/sales`、`/infra/workflow` 等）按 `docker port`
分别转发到本机对应端口，效果等价于生产环境网关的路径路由。

装配部署走 `brickkit up`——`component.yaml` 的 `deployment.image` 是一份 Nginx 镜像，
PC 在 `/`、移动端 H5 在 `/m/`（同一个容器，见 `Dockerfile`）。

## 怎么用

- 业务页面一律从 `packages/ui-kit-pc` 的 `BeListPage`/`BeDetailPage`/`BeFormPage`/
  `BeSettingsPage` 起手，表格一律用 `BeTable`（决策 113、§12.6.6）。
- 需要新增一个菜单项：在 `apps/pc/src/router/menuRegistry.ts` 登记
  `{ path, title, group, componentId, permission }`——`componentId`/`permission` 必须
  跟对应组件真实的 `assembly.yaml` 一致，不能编。
- 移动端组件走 uni-app 的 easycom（`wd-*` 标签直接用，不需要 `import`），第三方库注册
  收敛在 `packages/ui-kit-mobile`（主题桥接），具体原因与逃生口清单见该包的 README。

## 配置项

对应 `component.yaml` 的 `configSchema`（转成环境变量时用 SCREAMING_SNAKE_CASE）：

| 配置项 | 环境变量名 | 说明 |
|---|---|---|
| `gatewayBaseUrl` | `GATEWAY_BASE_URL` | 各业务组件 REST 面经网关的公共前缀，默认 `/` |
| `iamIssuerUrl` | `IAM_ISSUER_URL` | Casdoor 自己的公网 base URL，浏览器直连用（不经网关） |
| `casdoorClientId` | `CASDOOR_CLIENT_ID` | Casdoor 里对应 OIDC 应用的 client_id（public client，公开值不是密钥） |

纯静态 SPA 没有常驻进程能读 `process.env`，这三项由 Docker 镜像的
`docker-entrypoint.sh`（官方 nginx 镜像的 `/docker-entrypoint.d/` 机制）在容器启动时写进
构建产物——PC 写一份独立的 `config.js`，移动端因为真机踩过的坑（见根
`docs/dev/实测踩坑记录.md` A15）改成内联进 `index.html`。

## 参考实现

见 `docs/design/frontend-standard.md` §8（vue-vben-admin 的路由动态挂载机制、AWS Console
骨架、AntDV+vxe 的一次性接线活）。vxe-table 免费/企业版边界的核实结果见该文档同一节与
`_调研记录/03-阶段三.md` 第 7 条——三条"地板"能力（虚拟滚动、冻结列、可编辑单元格+Tab
连续录入）全部免费，已锁定不替换。

## 边界与禁令

| 什么 | 归谁 | 为什么 |
|---|---|---|
| 任何核心商业逻辑（价格计算、库存防超卖、信用额度校验） | 后端组件 | §8.4 铁律，前端要试算必须调后端 `DryRun` |
| 权限的判定 | 后端 `be-sdk` | 前端只决定"要不要显示"，不是安全边界（真机验证过：mock 前端权限并不能让后端也放行） |
| 复杂跨域聚合 | `infra-bff-mobile`（GraphQL） | 简单页面直接调网关，复杂页面走 BFF 一次查询 |
| 打印渲染 | `infra-print` | 前端拿到 PDF 字节流负责展示/下载 |
| 认证本身（账密/微信/QQ/Google） | Casdoor | 浏览器直连，前端不代理 |

详细的"不许"清单（含症状）见 `AGENTS.md`。
