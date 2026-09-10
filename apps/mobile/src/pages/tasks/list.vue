<script setup lang="ts">
/** 我的待办列表——移动端的主场景（design.md §1.1）。 */
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { listMyTasks, type Task } from "../../api/workflow";

const tasks = ref<Task[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);
const loadError = ref("");

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listMyTasks({ cursor: reset ? undefined : cursor.value });
    tasks.value = reset ? result.tasks : [...tasks.value, ...result.tasks];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
    loadError.value = "";
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "加载失败";
    uni.showToast({ title: loadError.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` });
}

onShow(() => load(true));
</script>

<template>
  <view class="page">
    <wd-navbar title="我的待办" fixed placeholder />
    <wd-status-tip v-if="!loading && tasks.length === 0" :tip="loadError || '暂无待办'" />
    <wd-cell-group v-else border>
      <wd-cell v-for="t in tasks" :key="t.id" :title="t.title" is-link @click="openDetail(t.id)">
        <wd-tag :type="t.type === 'EXCEPTION' ? 'warning' : 'primary'">{{ t.type === "EXCEPTION" ? "异常处理" : "审批" }}</wd-tag>
      </wd-cell>
    </wd-cell-group>
    <wd-loadmore v-if="tasks.length" :state="hasMore ? 'loading' : 'finished'" @loadmore="load(false)" />
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--be-color-bg);
}
</style>
