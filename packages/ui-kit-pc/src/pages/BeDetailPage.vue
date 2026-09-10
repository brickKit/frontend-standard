<script setup lang="ts">
/**
 * 详情页固定形态：返回按钮+标题+操作区 / 内容。不内嵌路由跳转逻辑——
 * "返回"只是个 emit，去哪由调用方的路由决定，保持本组件不依赖 vue-router
 * 也能单独渲染测试。
 *
 * ⚠️ 真实踩过的坑：`defineProps<{ showBack?: boolean }>()` 不写
 * `withDefaults` 时，Vue 编译器会给"只标了 Boolean 类型"的可选 prop
 * 自动推出 `default: false`（贴近原生 HTML 布尔属性的语义），不是
 * `undefined`。原来写的 `v-if="showBack !== false"` 以为"不传等于
 * undefined、undefined !== false 为 true"，实际上不传时 `showBack`
 * 已经被编译器隐式设成了 `false`——按钮默认反而不显示，跟设计意图
 * （默认显示，`showBack: false` 才是显式关掉）正好相反。用
 * `withDefaults` 把默认值写明确，不依赖这条隐式推断规则。
 */
import { ArrowLeftOutlined } from "@ant-design/icons-vue";
import { Button, Flex, Space, TypographyTitle } from "ant-design-vue";

withDefaults(defineProps<{ title: string; showBack?: boolean }>(), { showBack: true });
const emit = defineEmits<{ back: [] }>();
</script>

<template>
  <div class="be-detail-page">
    <Flex justify="space-between" align="center">
      <Space>
        <Button v-if="showBack" type="text" @click="emit('back')">
          <ArrowLeftOutlined />
        </Button>
        <TypographyTitle :level="4" style="margin: 0">{{ title }}</TypographyTitle>
      </Space>
      <Space><slot name="actions" /></Space>
    </Flex>
    <div class="be-detail-page__body"><slot /></div>
  </div>
</template>

<style scoped>
.be-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--be-space-md);
}
.be-detail-page__body {
  background: var(--be-color-surface);
  border: 1px solid var(--be-color-border);
  border-radius: var(--be-radius-md);
  padding: var(--be-space-lg);
}
</style>
