<script setup lang="ts">
import { Card, Empty, Typography } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useAccessStore } from "../stores/access";
import { useTabsStore } from "../stores/tabs";

const router = useRouter();
const access = useAccessStore();
const tabs = useTabsStore();

function open(path: string, title: string): void {
  tabs.open({ path, title });
  router.push(path);
}
</script>

<template>
  <div class="home">
    <Typography.Title :level="4">欢迎</Typography.Title>
    <Empty v-if="access.visibleMenu.length === 0" description="没有可用的功能——联系管理员分配角色" />
    <div v-else class="home__grid">
      <Card v-for="item in access.visibleMenu" :key="item.path" hoverable @click="open(item.path, item.title)">
        <Typography.Text strong>{{ item.title }}</Typography.Text>
        <div class="home__group">{{ item.group }}</div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--be-space-md);
  margin-top: var(--be-space-md);
}
.home__group {
  color: var(--be-color-text-secondary);
  font-size: var(--be-font-size-sm);
  margin-top: var(--be-space-xs);
}
</style>
