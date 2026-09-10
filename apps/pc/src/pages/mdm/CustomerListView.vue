<script setup lang="ts">
/** 客户列表（design.md §1.1：只读为主，建单要选客户）。 */
import { onMounted, ref } from "vue";
import { Button, message, Tag } from "ant-design-vue";
import { useRouter } from "vue-router";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { listCustomers, type Customer } from "../../api/customer";

const router = useRouter();
const customers = ref<Customer[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);

const columns = [
  { field: "code", title: "编码", width: 120 },
  { field: "name", title: "名称", width: 220 },
  { field: "tax_no", title: "税号", width: 180 },
  { field: "credit_limit", title: "信用额度", width: 120 },
  { field: "status", title: "状态", width: 100, slots: { default: "status" } },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listCustomers(reset ? undefined : cursor.value);
    customers.value = reset ? result.customers : [...customers.value, ...result.customers];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
  } catch (err) {
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

function openDetail(row: Customer): void {
  router.push(`/mdm/customers/${row.id}`);
}

onMounted(() => load(true));
</script>

<template>
  <BeListPage title="客户">
    <BeTable :columns="columns" :data="customers" :loading="loading" row-key="id" @refresh="load(true)" @row-click="(row) => openDetail(row as unknown as Customer)">
      <template #status="{ row }"><Tag :color="row.status === 'ACTIVE' ? 'green' : 'default'">{{ row.status }}</Tag></template>
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
