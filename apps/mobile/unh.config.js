import { defineConfig } from "@uni-helper/unh";

// 阶段三只做 H5 端（design.md §1.1：移动端只做待办与通知，浏览器/webview 访问即可）。
export default defineConfig({
  platform: {
    default: "h5",
  },
});
