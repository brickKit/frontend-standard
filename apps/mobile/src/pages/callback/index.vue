<script setup lang="ts">
/** design.md §3.4 第②③步的移动端落点。 */
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { getConfig } from "../../config";
import { exchangeCasdoorCode } from "../../auth/oidc";
import { exchangeAppToken } from "../../api/iam";

const errorMessage = ref("");

onLoad(async () => {
  try {
    const cfg = getConfig();
    const query = new URLSearchParams(window.location.search);
    const { idToken } = await exchangeCasdoorCode(
      { casdoorBaseUrl: cfg.iamIssuerUrl, clientId: cfg.casdoorClientId, redirectUri: `${window.location.origin}/pages/callback/index` },
      query,
    );
    await exchangeAppToken(idToken);
    uni.reLaunch({ url: "/pages/tasks/list" });
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "登录失败";
  }
});
</script>

<template>
  <view class="callback">
    <wd-status-tip v-if="errorMessage" tip="登录失败" />
    <text v-if="errorMessage" class="error-detail">{{ errorMessage }}</text>
    <wd-loading v-else />
  </view>
</template>

<style scoped>
.callback {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}
.error-detail {
  color: var(--be-color-text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
