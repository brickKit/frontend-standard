import { createSSRApp } from "vue";
import "@be/ui-kit-mobile";
import "@be/design-tokens/tokens.css";
import App from "./App.vue";

// uni-app H5 端的既有约定：入口必须是 createSSRApp（同 create-uni 官方
// 脚手架生成的写法），不是普通 Vue SPA 的 createApp——H5 编译产物走的是
// uni-app 自己的通用渲染管线，这条不是可选项。
export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
