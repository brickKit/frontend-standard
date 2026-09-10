<script setup lang="ts">
/** 待办详情：同意 / 驳回（驳回必须带附言，契约要求）。 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button, Descriptions, DescriptionsItem, message, Modal, Result, Space, Tag, Textarea, Timeline, TimelineItem } from "ant-design-vue";
import { BeDetailPage } from "@be/ui-kit-pc";
import { approveTask, getTask, rejectTask, type TaskDetail } from "../../api/workflow";

const route = useRoute();
const router = useRouter();
const task = ref<TaskDetail | null>(null);
const loadError = ref("");
const acting = ref(false);
const rejectOpen = ref(false);
const rejectComment = ref("");

async function reload(): Promise<void> {
  try {
    task.value = await getTask(route.params.id as string);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "加载失败";
  }
}

async function doApprove(): Promise<void> {
  if (!task.value) return;
  acting.value = true;
  try {
    task.value = await approveTask(task.value.id);
    message.success("已同意");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "操作失败");
  } finally {
    acting.value = false;
  }
}

async function submitReject(): Promise<void> {
  if (!task.value || !rejectComment.value.trim()) {
    message.warning("驳回必须填写附言");
    return;
  }
  acting.value = true;
  try {
    task.value = await rejectTask(task.value.id, rejectComment.value.trim());
    message.success("已驳回");
    rejectOpen.value = false;
    rejectComment.value = "";
  } catch (err) {
    message.error(err instanceof Error ? err.message : "操作失败");
  } finally {
    acting.value = false;
  }
}

const isPending = computed(() => task.value?.status === "PENDING");

onMounted(reload);
</script>

<template>
  <BeDetailPage v-if="task" :title="task.title" @back="router.push('/workflow/tasks')">
    <template #actions>
      <Space v-if="isPending">
        <Button type="primary" :loading="acting" @click="doApprove">同意</Button>
        <Button danger @click="rejectOpen = true">驳回</Button>
      </Space>
    </template>

    <Descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
      <DescriptionsItem label="类型">{{ task.type === "EXCEPTION" ? "异常处理" : "审批" }}</DescriptionsItem>
      <DescriptionsItem label="状态"><Tag>{{ task.status }}</Tag></DescriptionsItem>
      <DescriptionsItem label="来源组件">{{ task.source_component }}</DescriptionsItem>
      <DescriptionsItem label="截止时间">{{ task.due_at ?? "无" }}</DescriptionsItem>
    </Descriptions>

    <pre class="summary">{{ JSON.stringify(task.summary, null, 2) }}</pre>

    <Timeline v-if="task.actions.length" style="margin-top: 16px">
      <TimelineItem v-for="(a, i) in task.actions" :key="i">
        {{ a.actor_sub }} · {{ a.action }} · {{ a.created_at }}
        <div v-if="a.comment">{{ a.comment }}</div>
      </TimelineItem>
    </Timeline>
  </BeDetailPage>
  <Result v-else-if="loadError" status="error" title="加载失败" :sub-title="loadError">
    <template #extra><Button @click="router.push('/workflow/tasks')">返回列表</Button></template>
  </Result>

  <Modal v-model:open="rejectOpen" title="驳回" @ok="submitReject">
    <Textarea v-model:value="rejectComment" placeholder="驳回原因（必填）" :rows="3" />
  </Modal>
</template>

<style scoped>
.summary {
  background: var(--be-color-bg);
  padding: var(--be-space-md);
  border-radius: var(--be-radius-sm);
  font-size: var(--be-font-size-sm);
}
</style>
