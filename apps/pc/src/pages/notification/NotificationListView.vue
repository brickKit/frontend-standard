<script setup lang="ts">
/** 通知中心：站内信历史 + 通道偏好（design.md §1.1）。 */
import { onMounted, ref } from "vue";
import { Button, CheckboxGroup, message, Tabs, TabPane, Tag } from "ant-design-vue";
import { BeSettingsPage, BeTable } from "@be/ui-kit-pc";
import { getPreferences, listNotifications, setPreferences, type Channel, type NotificationRecord, type Preferences } from "../../api/notification";

const records = ref<NotificationRecord[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);

const columns = [
  { field: "title", title: "标题", width: 260 },
  { field: "category", title: "分类", width: 140 },
  { field: "channel", title: "通道", width: 100 },
  { field: "status", title: "状态", width: 120, slots: { default: "status" } },
  { field: "created_at", title: "时间", width: 180 },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listNotifications(reset ? undefined : cursor.value);
    records.value = reset ? result.records : [...records.value, ...result.records];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

const prefs = ref<Preferences | null>(null);
const CHANNEL_OPTIONS = [
  { label: "站内/IM", value: "IM" },
  { label: "邮件", value: "EMAIL" },
  { label: "短信", value: "SMS" },
];

async function loadPrefs(): Promise<void> {
  try {
    prefs.value = await getPreferences();
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载偏好失败");
  }
}

async function saveGlobalChannels(channels: Channel[]): Promise<void> {
  try {
    prefs.value = await setPreferences({ global_channels: channels });
    message.success("偏好已更新");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "更新失败（critical 类别不接受清空全部通道）");
    await loadPrefs();
  }
}

onMounted(() => {
  load(true);
  loadPrefs();
});
</script>

<template>
  <BeSettingsPage title="通知中心">
    <Tabs>
      <TabPane key="history" tab="通知历史">
        <BeTable :columns="columns" :data="records" :loading="loading" row-key="id" @refresh="load(true)">
          <template #status="{ row }"><Tag>{{ row.status }}</Tag></template>
        </BeTable>
        <div v-if="hasMore" class="load-more">
          <Button :loading="loading" @click="load(false)">加载更多</Button>
        </div>
      </TabPane>

      <TabPane key="preferences" tab="通道偏好">
        <div v-if="prefs">
          <p class="hint">全局通道（未单独设置的分类跟随这里；critical 分类不接受清空全部通道，服务端会拒绝）</p>
          <CheckboxGroup
            :value="prefs.global_channels"
            :options="CHANNEL_OPTIONS"
            @change="(val: (string | number | boolean)[]) => saveGlobalChannels(val as Channel[])"
          />
        </div>
      </TabPane>
    </Tabs>
  </BeSettingsPage>
</template>

<style scoped>
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--be-space-md);
}
.hint {
  color: var(--be-color-text-secondary);
  font-size: var(--be-font-size-sm);
}
</style>
