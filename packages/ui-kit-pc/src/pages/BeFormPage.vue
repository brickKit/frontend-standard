<script setup lang="ts">
/**
 * 表单页固定形态：标题 / 表单内容 / 吸底操作条（保存/取消）。
 * §8.4 铁律提醒：金额类的"实时试算"必须调后端 DryRun，本组件不提供
 * 任何前端算价的钩子——业务页面自己在 @submit 里调对应接口。
 */
import { Button, Flex, Space, TypographyTitle } from "ant-design-vue";

withDefaults(defineProps<{ title: string; submitting?: boolean; submitText?: string }>(), {
  submitting: false,
  submitText: "保存",
});
const emit = defineEmits<{ submit: []; cancel: [] }>();
</script>

<template>
  <div class="be-form-page">
    <TypographyTitle :level="4" style="margin: 0">{{ title }}</TypographyTitle>
    <div class="be-form-page__body"><slot /></div>
    <Flex justify="flex-end" class="be-form-page__footer">
      <Space>
        <Button @click="emit('cancel')">取消</Button>
        <Button type="primary" :loading="submitting" @click="emit('submit')">{{ submitText }}</Button>
      </Space>
    </Flex>
  </div>
</template>

<style scoped>
.be-form-page {
  display: flex;
  flex-direction: column;
  gap: var(--be-space-md);
}
.be-form-page__body {
  background: var(--be-color-surface);
  border: 1px solid var(--be-color-border);
  border-radius: var(--be-radius-md);
  padding: var(--be-space-lg);
  max-width: 720px;
}
.be-form-page__footer {
  border-top: 1px solid var(--be-color-border);
  padding-top: var(--be-space-md);
}
</style>
