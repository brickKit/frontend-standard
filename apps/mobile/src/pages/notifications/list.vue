<script setup lang="ts">
/** 通知中心（design.md §1.1）——移动端只做历史列表，通道偏好设置留在 PC 端。 */
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { listNotifications, type NotificationRecord } from "../../api/notification";

const records = ref<NotificationRecord[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);
const loadError = ref("");

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listNotifications(reset ? undefined : cursor.value);
    records.value = reset ? result.records : [...records.value, ...result.records];
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

onShow(() => load(true));
</script>

<template>
  <view class="page">
    <wd-navbar title="通知中心" fixed placeholder />
    <wd-status-tip v-if="!loading && records.length === 0" :tip="loadError || '暂无通知'" />
    <wd-cell-group v-else border>
      <wd-cell v-for="r in records" :key="r.id" :title="r.title" :label="r.created_at">
        <wd-tag>{{ r.status }}</wd-tag>
      </wd-cell>
    </wd-cell-group>
    <wd-loadmore v-if="records.length" :state="hasMore ? 'loading' : 'finished'" @loadmore="load(false)" />
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--be-color-bg);
}
</style>
