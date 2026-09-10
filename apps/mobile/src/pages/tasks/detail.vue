<script setup lang="ts">
/** 待办详情：同意 / 驳回（驳回必须带附言，契约要求）。 */
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { approveTask, getTask, rejectTask, type TaskDetail } from "../../api/workflow";

const taskId = ref("");
const task = ref<TaskDetail | null>(null);
const loadError = ref("");
const acting = ref(false);
const rejectOpen = ref(false);
const rejectComment = ref("");

async function reload(): Promise<void> {
  try {
    task.value = await getTask(taskId.value);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "加载失败";
  }
}

async function doApprove(): Promise<void> {
  if (!task.value) return;
  acting.value = true;
  try {
    task.value = await approveTask(task.value.id);
    uni.showToast({ title: "已同意", icon: "success" });
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : "操作失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

async function submitReject(): Promise<void> {
  if (!task.value || !rejectComment.value.trim()) {
    uni.showToast({ title: "驳回必须填写附言", icon: "none" });
    return;
  }
  acting.value = true;
  try {
    task.value = await rejectTask(task.value.id, rejectComment.value.trim());
    uni.showToast({ title: "已驳回", icon: "success" });
    rejectOpen.value = false;
    rejectComment.value = "";
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : "操作失败", icon: "none" });
  } finally {
    acting.value = false;
  }
}

const isPending = computed(() => task.value?.status === "PENDING");

onLoad((query) => {
  taskId.value = (query as { id?: string })?.id ?? "";
  void reload();
});

function goBack(): void {
  uni.navigateBack();
}
</script>

<template>
  <view class="page">
    <wd-navbar :title="task?.title ?? '待办详情'" left-arrow fixed placeholder @click-left="goBack" />

    <view v-if="task" class="content">
      <wd-cell-group border>
        <wd-cell title="类型" :value="task.type === 'EXCEPTION' ? '异常处理' : '审批'" />
        <wd-cell title="状态" :value="task.status" />
        <wd-cell title="来源组件" :value="task.source_component" />
        <wd-cell title="截止时间" :value="task.due_at ?? '无'" />
      </wd-cell-group>

      <view class="summary">{{ JSON.stringify(task.summary, null, 2) }}</view>

      <view v-if="isPending" class="actions">
        <wd-button block type="success" :loading="acting" @click="doApprove">同意</wd-button>
        <wd-button block type="error" plain @click="rejectOpen = true">驳回</wd-button>
      </view>
    </view>
    <wd-status-tip v-else-if="loadError" :tip="loadError" />

    <wd-popup v-model="rejectOpen" position="bottom" custom-style="padding: 16px;">
      <wd-textarea v-model="rejectComment" placeholder="驳回原因（必填）" :maxlength="200" show-word-limit />
      <wd-button block type="error" custom-style="margin-top: 12px" :loading="acting" @click="submitReject">确认驳回</wd-button>
    </wd-popup>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--be-color-bg);
}
.content {
  padding: 12px;
}
.summary {
  background: var(--be-color-surface);
  padding: 12px;
  margin-top: 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
