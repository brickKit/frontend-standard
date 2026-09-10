<script setup lang="ts">
/**
 * PC 骨架（决策 113，§3.5/§12.6.7）：服务选择器+收藏栏 / 组织切换器 /
 * ⌘K / 服务内扁平菜单 / 应用内标签页。**两处必改**（对比 AWS Console）：
 * 服务内菜单强制扁平（不做多级树，决策 113 理由：62 个客户装的组件不同，
 * 树形状家家不同，AI 生成页面时不知道落在哪层）；有应用内标签页（ERP
 * 未保存表单不能一刷就没）。
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Avatar,
  Dropdown,
  Input,
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutSider,
  Menu,
  MenuItem,
  Modal,
  Space,
  Tabs,
  TabPane,
  Typography,
} from "ant-design-vue";
import { SearchOutlined, UserOutlined } from "@ant-design/icons-vue";
import { useAccessStore } from "../stores/access";
import { useTabsStore } from "../stores/tabs";
import { useOrgContextStore } from "../stores/orgContext";
import { useAuthStore } from "../stores/auth";
import { logout } from "../api/iam";

const route = useRoute();
const router = useRouter();
const access = useAccessStore();
const tabs = useTabsStore();
const org = useOrgContextStore();
const auth = useAuthStore();

const groups = computed(() => [...new Set(access.visibleMenu.map((m) => m.group))]);
const currentGroup = computed(() => access.visibleMenu.find((m) => m.path === route.path)?.group ?? groups.value[0]);
const groupItems = computed(() => access.visibleMenu.filter((m) => m.group === currentGroup.value));

function openMenuEntry(path: string, title: string): void {
  tabs.open({ path, title });
  if (route.path !== path) router.push(path);
}

function closeTab(path: string): void {
  const fallback = tabs.close(path);
  if (route.path === path) {
    router.push(fallback?.path ?? "/");
  }
}

async function handleLogout(): Promise<void> {
  await logout();
  router.push("/login");
}

// ⌘K 全局搜索（§3.5）
const searchOpen = ref(false);
const searchKeyword = ref("");
const searchResults = computed(() =>
  searchKeyword.value.trim()
    ? access.visibleMenu.filter((m) => m.title.includes(searchKeyword.value.trim()))
    : access.visibleMenu,
);
function onGlobalKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchOpen.value = true;
  }
}
function jumpTo(path: string, title: string): void {
  searchOpen.value = false;
  searchKeyword.value = "";
  openMenuEntry(path, title);
}
onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onUnmounted(() => window.removeEventListener("keydown", onGlobalKeydown));
</script>

<template>
  <Layout style="height: 100vh">
    <LayoutHeader class="app-header">
      <Typography.Title :level="5" style="color: #fff; margin: 0">BrickEnterprise</Typography.Title>

      <Space class="app-header__services">
        <Dropdown v-for="group in groups" :key="group">
          <a class="service-link" :class="{ active: group === currentGroup }" @click.prevent>{{ group }}</a>
          <template #overlay>
            <Menu>
              <MenuItem v-for="item in access.visibleMenu.filter((m) => m.group === group)" :key="item.path" @click="openMenuEntry(item.path, item.title)">
                {{ item.title }}
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </Space>

      <Space class="app-header__right">
        <a class="search-trigger" @click="searchOpen = true"><SearchOutlined /> 搜索（⌘K）</a>
        <Dropdown>
          <a @click.prevent>{{ org.currentLegalEntity }}</a>
          <template #overlay>
            <Menu @click="(info: { key: string | number }) => org.setCurrentLegalEntity(String(info.key))">
              <MenuItem key="默认法人">默认法人</MenuItem>
            </Menu>
          </template>
        </Dropdown>
        <Dropdown>
          <a @click.prevent><Avatar size="small"><UserOutlined /></Avatar></a>
          <template #overlay>
            <Menu>
              <MenuItem key="logout" @click="handleLogout">退出登录</MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </Space>
    </LayoutHeader>

    <Tabs
      v-if="tabs.openTabs.length"
      :active-key="route.path"
      type="editable-card"
      hide-add
      class="app-tabs"
      @change="(key: string | number) => router.push(String(key))"
      @edit="(target: string | number | MouseEvent | KeyboardEvent) => closeTab(String(target))"
    >
      <TabPane v-for="tab in tabs.openTabs" :key="tab.path" :tab="tab.title" :closable="tabs.openTabs.length > 1" />
    </Tabs>

    <Layout>
      <LayoutSider width="180" class="app-sider" theme="light">
        <Menu mode="inline" :selected-keys="[route.path]">
          <MenuItem v-for="item in groupItems" :key="item.path" @click="openMenuEntry(item.path, item.title)">
            {{ item.title }}
          </MenuItem>
        </Menu>
      </LayoutSider>
      <LayoutContent class="app-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </LayoutContent>
    </Layout>
  </Layout>

  <Modal v-model:open="searchOpen" :footer="null" title="全局搜索" width="480">
    <Input v-model:value="searchKeyword" placeholder="搜索页面…" autofocus>
      <template #prefix><SearchOutlined /></template>
    </Input>
    <Menu class="search-results">
      <MenuItem v-for="item in searchResults" :key="item.path" @click="jumpTo(item.path, item.title)">
        {{ item.group }} / {{ item.title }}
      </MenuItem>
    </Menu>
  </Modal>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: var(--be-space-lg);
  padding: 0 var(--be-space-lg);
}
.app-header__services {
  flex: 1;
}
.app-header__right {
  margin-left: auto;
}
.service-link {
  color: rgba(255, 255, 255, 0.75);
}
.service-link.active {
  color: #fff;
  font-weight: 600;
}
.search-trigger {
  color: rgba(255, 255, 255, 0.75);
}
.app-tabs {
  background: var(--be-color-surface);
  padding: 0 var(--be-space-md);
}
.app-sider {
  border-right: 1px solid var(--be-color-border);
}
.app-content {
  padding: var(--be-space-lg);
  overflow: auto;
}
.search-results {
  margin-top: var(--be-space-md);
  max-height: 320px;
  overflow: auto;
  border: none;
}
</style>
