<script setup lang="ts">
/** design.md §3.4 第①步的落点：整页跳去 Casdoor，不渲染任何交互表单——账密/社交登录全在 Casdoor 自己的页面上（§6.1）。 */
import { onMounted } from "vue";
import { Spin } from "ant-design-vue";
import { getConfig } from "../config";
import { redirectToLogin } from "../auth/oidc";

onMounted(() => {
  const cfg = getConfig();
  void redirectToLogin({
    casdoorBaseUrl: cfg.iamIssuerUrl,
    clientId: cfg.casdoorClientId,
    redirectUri: `${window.location.origin}/callback`,
  });
});
</script>

<template>
  <div class="login-redirect">
    <Spin size="large" tip="正在跳转到登录页…" />
  </div>
</template>

<style scoped>
.login-redirect {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
