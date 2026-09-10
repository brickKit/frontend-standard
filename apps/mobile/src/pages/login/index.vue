<script setup lang="ts">
/** design.md §3.4 第①步的移动端落点。逻辑同 apps/pc 的 LoginView.vue,redirect_uri 换成移动端自己的 /pages/callback/index。 */
import { onShow } from "@dcloudio/uni-app";
import { getConfig } from "../../config";
import { redirectToLogin } from "../../auth/oidc";
import { isAuthenticated } from "../../auth/state";

onShow(() => {
  if (isAuthenticated()) {
    uni.reLaunch({ url: "/pages/tasks/list" });
    return;
  }
  const cfg = getConfig();
  void redirectToLogin({
    casdoorBaseUrl: cfg.iamIssuerUrl,
    clientId: cfg.casdoorClientId,
    redirectUri: `${window.location.origin}/pages/callback/index`,
  });
});
</script>

<template>
  <view class="login-redirect">
    <wd-loading />
    <text>正在跳转到登录页…</text>
  </view>
</template>

<style scoped>
.login-redirect {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style>
