<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button, Descriptions, DescriptionsItem, Result, Tag, Typography } from "ant-design-vue";
import { BeDetailPage } from "@be/ui-kit-pc";
import { getCustomer, type Customer } from "../../api/customer";

const route = useRoute();
const router = useRouter();
const customer = ref<Customer | null>(null);
const loadError = ref("");

onMounted(async () => {
  try {
    customer.value = await getCustomer(route.params.id as string);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "加载失败";
  }
});
</script>

<template>
  <BeDetailPage v-if="customer" :title="customer.name" @back="router.push('/mdm/customers')">
    <Descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
      <DescriptionsItem label="编码">{{ customer.code }}</DescriptionsItem>
      <DescriptionsItem label="状态"><Tag>{{ customer.status }}</Tag></DescriptionsItem>
      <DescriptionsItem label="税号">{{ customer.tax_no }}</DescriptionsItem>
      <DescriptionsItem label="信用额度">{{ customer.credit_limit }}</DescriptionsItem>
    </Descriptions>

    <Typography.Title :level="5">联系人</Typography.Title>
    <ul>
      <li v-for="c in customer.contacts" :key="c.id">{{ c.name }} · {{ c.phone }} · {{ c.email }} <Tag v-if="c.primary">主要联系人</Tag></li>
    </ul>
  </BeDetailPage>
  <Result v-else-if="loadError" status="error" title="加载失败" :sub-title="loadError">
    <template #extra><Button @click="router.push('/mdm/customers')">返回列表</Button></template>
  </Result>
</template>
