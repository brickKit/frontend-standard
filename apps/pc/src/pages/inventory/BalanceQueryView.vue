<script setup lang="ts">
/** 库存查询（design.md §1.1：只读，不做出入库/手工凭证界面）。GetBalance 要求 product_id+warehouse_id 都填，不是一个可浏览的列表——先查余额，再按同样的过滤条件看流水。 */
import { ref } from "vue";
import { Button, Descriptions, DescriptionsItem, Form, FormItem, Input, message } from "ant-design-vue";
import { BeListPage, BeTable } from "@be/ui-kit-pc";
import { getBalance, listMovements, type Balance, type Movement } from "../../api/inventory";

const productId = ref("");
const warehouseId = ref("");
const balance = ref<Balance | null>(null);
const movements = ref<Movement[]>([]);
const loading = ref(false);

const movementColumns = [
  { field: "reason", title: "原因", width: 120 },
  { field: "qty", title: "数量", width: 100 },
  { field: "order_id", title: "来源单据", width: 160 },
  { field: "created_at", title: "时间", width: 180 },
];

async function query(): Promise<void> {
  if (!productId.value || !warehouseId.value) {
    message.warning("产品与仓库都必填");
    return;
  }
  loading.value = true;
  try {
    const [b, m] = await Promise.all([
      getBalance(productId.value, warehouseId.value),
      listMovements({ productId: productId.value, warehouseId: warehouseId.value }),
    ]);
    balance.value = b;
    movements.value = m.movements;
  } catch (err) {
    message.error(err instanceof Error ? err.message : "查询失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <BeListPage title="库存查询">
    <template #filters>
      <Form layout="inline">
        <FormItem label="产品 ID"><Input v-model:value="productId" style="width: 220px" /></FormItem>
        <FormItem label="仓库 ID"><Input v-model:value="warehouseId" style="width: 220px" /></FormItem>
        <FormItem><Button type="primary" :loading="loading" @click="query">查询</Button></FormItem>
      </Form>
    </template>

    <div v-if="balance" style="padding: 16px">
      <Descriptions :column="3" bordered size="small" style="margin-bottom: 16px">
        <DescriptionsItem label="在库数量">{{ balance.on_hand_qty }}</DescriptionsItem>
        <DescriptionsItem label="已预留">{{ balance.reserved_qty }}</DescriptionsItem>
        <DescriptionsItem label="可用数量">{{ balance.available_qty }}</DescriptionsItem>
      </Descriptions>
      <BeTable :columns="movementColumns" :data="movements" row-key="id" :show-toolbar="false" />
    </div>
  </BeListPage>
</template>
