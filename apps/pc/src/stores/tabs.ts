/**
 * 应用内标签页（决策 113 第二处必改）：ERP 一张未保存的表单浏览器一刷就没了，
 * 所以骨架必须有标签页，不能照抄 AWS Console 没有标签页这一点。
 */
import { defineStore } from "pinia";
import { ref } from "vue";

export interface BeTab {
  path: string;
  title: string;
}

export const useTabsStore = defineStore("tabs", () => {
  const openTabs = ref<BeTab[]>([]);
  const activePath = ref("");

  function open(tab: BeTab): void {
    activePath.value = tab.path;
    if (!openTabs.value.some((t) => t.path === tab.path)) {
      openTabs.value.push(tab);
    }
  }

  function close(path: string): BeTab | undefined {
    const idx = openTabs.value.findIndex((t) => t.path === path);
    if (idx === -1) return undefined;
    openTabs.value.splice(idx, 1);
    if (activePath.value === path) {
      const fallback = openTabs.value[idx] ?? openTabs.value[idx - 1];
      activePath.value = fallback?.path ?? "";
      return fallback;
    }
    return undefined;
  }

  return { openTabs, activePath, open, close };
});
