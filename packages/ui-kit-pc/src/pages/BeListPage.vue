<script setup lang="ts">
/**
 * 决策 113：业务页面一律从页面级模板起手，不从空白 <div> 摆布局。
 * 列表页固定形态：标题+操作区 / 筛选区（可选）/ 内容卡片（放 <BeTable>）。
 */
import { Card, Flex, Space, TypographyTitle } from "ant-design-vue";

defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="be-list-page">
    <Flex justify="space-between" align="center">
      <div>
        <TypographyTitle :level="4" style="margin: 0">{{ title }}</TypographyTitle>
        <div v-if="description" class="be-list-page__desc">{{ description }}</div>
      </div>
      <Space><slot name="actions" /></Space>
    </Flex>
    <div v-if="$slots.filters" class="be-list-page__filters"><slot name="filters" /></div>
    <Card :body-style="{ padding: 0 }"><slot /></Card>
  </div>
</template>

<style scoped>
.be-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--be-space-md);
}
.be-list-page__desc {
  color: var(--be-color-text-secondary);
  font-size: var(--be-font-size-sm);
}
.be-list-page__filters {
  background: var(--be-color-surface);
  border: 1px solid var(--be-color-border);
  border-radius: var(--be-radius-md);
  padding: var(--be-space-md);
}
</style>
