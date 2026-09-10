<script setup lang="ts">
/** 销售订单详情：确认 / 发货 / 打印送货单（design.md §1.1，infra-print 的入口）。 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button, Descriptions, DescriptionsItem, message, Result, Space, Tag } from "ant-design-vue";
import { BeDetailPage, BeTable } from "@be/ui-kit-pc";
import { cancelOrder, confirmOrder, getOrder, shipOrder, type Order } from "../../api/sales";
import { renderDeliveryNote } from "../../api/print";

const route = useRoute();
const router = useRouter();
const order = ref<Order | null>(null);
const loadError = ref("");
const acting = ref(false);

const itemColumns = [
  { field: "product_name", title: "产品", width: 200 },
  { field: "qty", title: "数量", width: 100 },
  { field: "unit_price", title: "单价", width: 120 },
  { field: "discount", title: "折扣", width: 100 },
  { field: "subtotal", title: "小计", width: 120 },
];

async function reload(): Promise<void> {
  try {
    order.value = await getOrder(route.params.id as string);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "加载失败";
  }
}

async function doConfirm(): Promise<void> {
  if (!order.value) return;
  acting.value = true;
  try {
    order.value = await confirmOrder(order.value.id);
    message.success("已确认");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "确认失败");
  } finally {
    acting.value = false;
  }
}

async function doShip(): Promise<void> {
  if (!order.value) return;
  acting.value = true;
  try {
    order.value = await shipOrder(order.value.id);
    message.success("已发货");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "发货失败");
  } finally {
    acting.value = false;
  }
}

async function doCancel(): Promise<void> {
  if (!order.value) return;
  acting.value = true;
  try {
    order.value = await cancelOrder(order.value.id);
    message.success("已取消");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "取消失败");
  } finally {
    acting.value = false;
  }
}

async function doPrint(): Promise<void> {
  if (!order.value) return;
  try {
    const blob = await renderDeliveryNote(order.value);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "打印失败");
  }
}

const canConfirm = computed(() => order.value?.status === "DRAFT");
const canShip = computed(() => order.value?.status === "CONFIRMED");
const canCancel = computed(() => order.value?.status === "DRAFT" || order.value?.status === "CONFIRMED");
const canPrint = computed(() => order.value?.status === "CONFIRMED" || order.value?.status === "SHIPPED");

onMounted(reload);
</script>

<template>
  <BeDetailPage v-if="order" :title="`订单 ${order.order_no}`" @back="router.push('/sales/orders')">
    <template #actions>
      <Space>
        <Button v-if="canConfirm" type="primary" :loading="acting" @click="doConfirm">确认订单</Button>
        <Button v-if="canShip" type="primary" :loading="acting" @click="doShip">发货</Button>
        <Button v-if="canPrint" @click="doPrint">打印送货单</Button>
        <Button v-if="canCancel" danger :loading="acting" @click="doCancel">取消订单</Button>
      </Space>
    </template>

    <Descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
      <DescriptionsItem label="客户">{{ order.customer_name }}</DescriptionsItem>
      <DescriptionsItem label="状态"><Tag>{{ order.status }}</Tag></DescriptionsItem>
      <DescriptionsItem label="金额">{{ order.total_amount }}</DescriptionsItem>
      <DescriptionsItem label="创建时间">{{ order.created_at }}</DescriptionsItem>
    </Descriptions>

    <BeTable :columns="itemColumns" :data="order.items" row-key="product_id" :show-toolbar="false" />
  </BeDetailPage>
  <Result v-else-if="loadError" status="error" title="加载失败" :sub-title="loadError">
    <template #extra><Button @click="router.push('/sales/orders')">返回列表</Button></template>
  </Result>
</template>
