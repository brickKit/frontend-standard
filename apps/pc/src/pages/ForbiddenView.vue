<script setup lang="ts">
import { Result, Button } from "ant-design-vue";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <Result status="403" title="403" sub-title="没有权限访问这个页面">
    <template #extra>
      <Button type="primary" @click="router.push('/')">回首页</Button>
    </template>
  </Result>
</template>
