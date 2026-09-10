<script setup lang="ts">
/** design.md §3.4 第②③步的落点：Casdoor 带 code 回调到这里，换 id_token → 换应用 token → 引导进主界面。 */
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Alert, Spin } from "ant-design-vue";
import { getConfig } from "../config";
import { exchangeCasdoorCode } from "../auth/oidc";
import { exchangeAppToken } from "../api/iam";
import { bootstrapAfterAuth } from "../auth/bootstrap";

const route = useRoute();
const router = useRouter();
const errorMessage = ref("");

onMounted(async () => {
  try {
    const cfg = getConfig();
    const query = new URLSearchParams(window.location.search);
    const { idToken } = await exchangeCasdoorCode(
      { casdoorBaseUrl: cfg.iamIssuerUrl, clientId: cfg.casdoorClientId, redirectUri: `${window.location.origin}/callback` },
      query,
    );
    await exchangeAppToken(idToken);
    await bootstrapAfterAuth();

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "登录失败";
  }
});
</script>

<template>
  <div class="callback">
    <Alert v-if="errorMessage" type="error" :message="'登录失败'" :description="errorMessage" show-icon />
    <Spin v-else size="large" tip="正在登录…" />
  </div>
</template>

<style scoped>
.callback {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
