<script setup lang="ts">
/** 销售订单列表（design.md §1.1："链路的主干"）。游标分页：见 BeTable 组件内的注释，累加式"加载更多"，不是页码。 */
import { onMounted, ref } from "vue";
import { Button, message, Select, Space, Tag } from "ant-design-vue";
import { useRouter } from "vue-router";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { listOrders, type Order, type OrderStatus } from "../../api/sales";

const router = useRouter();
const orders = ref<Order[]>([]);
const loading = ref(false);
const cursor = ref<string | undefined>(undefined);
const hasMore = ref(false);
const statusFilter = ref<OrderStatus | undefined>(undefined);

const columns = [
  { field: "order_no", title: "订单号", width: 160 },
  { field: "customer_name", title: "客户", width: 200 },
  { field: "status", title: "状态", width: 120, slots: { default: "status" } },
  { field: "total_amount", title: "金额", width: 140 },
  { field: "created_at", title: "创建时间", width: 180 },
];

async function load(reset: boolean): Promise<void> {
  loading.value = true;
  try {
    const result = await listOrders({ cursor: reset ? undefined : cursor.value, statusFilter: statusFilter.value });
    orders.value = reset ? result.orders : [...orders.value, ...result.orders];
    cursor.value = result.next_cursor;
    hasMore.value = Boolean(result.next_cursor);
  } catch (err) {
    // 真机浏览器测试真实抓到过的坑：这里原来没有 catch，后端一个 403/500
    // 就变成未捕获的 Promise rejection，Vue 打一条"Unhandled error during
    // execution of mounted hook"警告，页面停在"加载中"且用户看不到任何
    // 提示。§14.1.8 的教训在这里也成立："前端判定不是安全边界"——后端
    // 拒绝是预期中会发生的事，不是异常路径，必须捕获并给出可见反馈。
    message.error(err instanceof Error ? err.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

function openDetail(row: Order): void {
  router.push(`/sales/orders/${row.id}`);
}

onMounted(() => load(true));
</script>

<template>
  <BeListPage title="销售订单">
    <template #filters>
      <Space>
        <Select
          v-model:value="statusFilter"
          placeholder="全部状态"
          allow-clear
          style="width: 160px"
          :options="[
            { label: 'DRAFT', value: 'DRAFT' },
            { label: 'CONFIRMED', value: 'CONFIRMED' },
            { label: 'SHIPPED', value: 'SHIPPED' },
            { label: 'COMPLETED', value: 'COMPLETED' },
            { label: 'CANCELLED', value: 'CANCELLED' },
            { label: 'SUSPENDED', value: 'SUSPENDED' },
          ]"
          @change="load(true)"
        />
      </Space>
    </template>

    <BeTable
      :columns="columns"
      :data="orders"
      :loading="loading"
      row-key="id"
      @refresh="load(true)"
      @row-click="(row: Record<string, unknown>) => openDetail(row as unknown as Order)"
    >
      <template #status="{ row }">
        <Tag :color="row.status === 'SUSPENDED' ? 'red' : row.status === 'CANCELLED' ? 'default' : 'blue'">{{ row.status }}</Tag>
      </template>
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
