<script setup lang="ts">
/** 我的待办列表（design.md §1.1：链路里"审批"那一环，也是移动端的主场景）。 */
import { onMounted, ref } from "vue";
import { Button, message, Tag } from "ant-design-vue";
import { useRouter } from "vue-router";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { listMyTasks, type Task } from "../../api/workflow";

const router = useRouter();
const tasks = ref<Task[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);

const columns = [
  { field: "title", title: "标题", width: 260 },
  { field: "type", title: "类型", width: 100, slots: { default: "type" } },
  { field: "status", title: "状态", width: 100, slots: { default: "status" } },
  { field: "due_at", title: "截止时间", width: 180 },
  { field: "created_at", title: "创建时间", width: 180 },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listMyTasks({ status: "PENDING", cursor: reset ? undefined : cursor.value });
    tasks.value = reset ? result.tasks : [...tasks.value, ...result.tasks];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

function openDetail(row: Task): void {
  router.push(`/workflow/tasks/${row.id}`);
}

onMounted(() => load(true));
</script>

<template>
  <BeListPage title="我的待办">
    <BeTable :columns="columns" :data="tasks" :loading="loading" row-key="id" @refresh="load(true)" @row-click="(row) => openDetail(row as unknown as Task)">
      <template #type="{ row }">{{ row.type === "EXCEPTION" ? "异常处理" : "审批" }}</template>
      <template #status="{ row }"><Tag>{{ row.status }}</Tag></template>
    </BeTable>
    <div v-if="hasMore" class="load-more">
      <Button :loading="loading" @click="load(false)">加载更多</Button>
    </div>
  </BeListPage>
</template>

<style scoped>
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--be-space-md);
}
</style>
