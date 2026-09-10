<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ConfigProvider } from "ant-design-vue";
import { beAntdThemeConfig } from "@be/ui-kit-pc";
import AppLayout from "./layouts/AppLayout.vue";

const route = useRoute();
const isPublicRoute = computed(() => Boolean(route.meta.public));
</script>

<template>
  <ConfigProvider :theme="beAntdThemeConfig">
    <AppLayout v-if="!isPublicRoute" />
    <router-view v-else />
  </ConfigProvider>
</template>
