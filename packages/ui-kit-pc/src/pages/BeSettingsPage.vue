<script setup lang="ts">
/**
 * 设置页固定形态：标题+说明 / 内容。用于偏好设置、通道偏好、角色管理
 * 这类"不是列表也不是表单"的页面——比 BeFormPage 更松散，不强制吸底操作条
 * （角色管理里"授权"是逐行的按钮操作，不是一次性提交整个表单）。
 */
import { TypographyParagraph, TypographyTitle } from "ant-design-vue";

defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="be-settings-page">
    <div>
      <TypographyTitle :level="4" style="margin: 0">{{ title }}</TypographyTitle>
      <TypographyParagraph v-if="description" type="secondary" style="margin: 0">
        {{ description }}
      </TypographyParagraph>
    </div>
    <div class="be-settings-page__body"><slot /></div>
  </div>
</template>

<style scoped>
.be-settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--be-space-md);
}
.be-settings-page__body {
  background: var(--be-color-surface);
  border: 1px solid var(--be-color-border);
  border-radius: var(--be-radius-md);
  padding: var(--be-space-lg);
}
</style>
