/**
 * 真实踩到的坑：vxe-table@4.x 把表格逻辑（`vxe-table` 包）和实际 UI 组件
 * （`vxe-pc-ui` 包的 VxeButton/VxeTooltip 等）拆开了，工具栏按钮、单元格
 * 提示这些都是从 `vxe-pc-ui` 里另外装的——不装的症状不是"报错"，是
 * "整个表体和工具栏按钮都不渲染"（控制台只有一行容易被忽略的警告：
 * "缺少 vxe-button 组件"）。一开始怀疑是 jsdom 没有真实布局引擎导致
 * 虚拟滚动测不出来，加了 ResizeObserver/offsetWidth 的 polyfill 也没用；
 * 补上这两行插件注册之后表头、行数据、工具栏按钮全部在 jsdom 里正常
 * 渲染——说明真正的根因是漏装组件，不是布局引擎（polyfill 试过之后
 * 确认不需要，删掉了）。
 *
 * `apps/pc/src/main.ts` 会用真实的 `app.use(VxeUIBase).use(VxeUITable)`
 * 装一次；这里用 @vue/test-utils 的全局 plugins 配置复刻同一件事，
 * 两处必须保持一致。
 */
import { config } from "@vue/test-utils";
import VxeUIBase from "vxe-pc-ui";
import VxeUITable from "vxe-table";

config.global.plugins.push(VxeUIBase, VxeUITable);
