<script setup lang="ts">
/** 应收查询（design.md §1.1：验证链路结果，只读，不做手工凭证界面）。 */
import { onMounted, ref } from "vue";
import { Button, Form, FormItem, Input, message } from "ant-design-vue";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { listARLedger, type ARLedgerEntry } from "../../api/finance";

const customerId = ref("");
const entries = ref<ARLedgerEntry[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);

const columns = [
  { field: "customer_id", title: "客户 ID", width: 200 },
  { field: "entry_id", title: "凭证 ID", width: 200 },
  { field: "amount", title: "金额", width: 140 },
  { field: "reconciled_amount", title: "已核销", width: 140 },
  { field: "created_at", title: "时间", width: 180 },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listARLedger({ customerId: customerId.value || undefined, cursor: reset ? undefined : cursor.value });
    entries.value = reset ? result.entries : [...entries.value, ...result.entries];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(true));
</script>

<template>
  <BeListPage title="应收查询">
    <template #filters>
      <Form layout="inline">
        <FormItem label="客户 ID"><Input v-model:value="customerId" style="width: 220px" /></FormItem>
        <FormItem><Button @click="load(true)">查询</Button></FormItem>
      </Form>
    </template>

    <BeTable :columns="columns" :data="entries" :loading="loading" row-key="id" @refresh="load(true)" />
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
