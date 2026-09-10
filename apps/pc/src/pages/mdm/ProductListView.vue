<script setup lang="ts">
/** 产品列表（只读为主，建单要选产品）。没有独立详情页——阶段三只读为主，字段已经全在列表里，不强行拆一个详情页凑格式。 */
import { onMounted, ref } from "vue";
import { Button, message, Tag } from "ant-design-vue";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { listProducts, type Product } from "../../api/product";

const products = ref<Product[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);

const columns = [
  { field: "sku", title: "SKU", width: 140 },
  { field: "name", title: "名称", width: 220 },
  { field: "tracking_type", title: "追踪方式", width: 120 },
  { field: "standard_cost", title: "标准成本", width: 120 },
  { field: "status", title: "状态", width: 100, slots: { default: "status" } },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listProducts(reset ? undefined : cursor.value);
    products.value = reset ? result.products : [...products.value, ...result.products];
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
  <BeListPage title="产品">
    <BeTable :columns="columns" :data="products" :loading="loading" row-key="id" @refresh="load(true)">
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
