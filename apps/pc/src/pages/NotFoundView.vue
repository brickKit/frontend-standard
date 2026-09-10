<script setup lang="ts">
import { Result, Button } from "ant-design-vue";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <Result status="404" title="404" sub-title="页面不存在，或者这个环境没有装对应的组件">
    <template #extra>
      <Button type="primary" @click="router.push('/')">回首页</Button>
    </template>
  </Result>
</template>
