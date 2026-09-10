/**
 * §3.3：可见路由 = features ∩ permissions，两个都要判。`features` 登录前
 * 就能拉（besdk.Public，决定要不要显示"登录"之外的任何东西），
 * `permissions` 登录后才有意义。
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { fetchMyPermissions, fetchTenantFeatures } from "../api/iam";
import { MENU_REGISTRY, type MenuEntry } from "../router/menuRegistry";

export const useAccessStore = defineStore("access", () => {
  const features = ref<Set<string>>(new Set());
  const permissions = ref<Set<string>>(new Set());
  const featuresLoaded = ref(false);
  const permissionsLoaded = ref(false);

  async function loadFeatures(): Promise<void> {
    const { enabled_components } = await fetchTenantFeatures();
    features.value = new Set(enabled_components);
    featuresLoaded.value = true;
  }

  async function loadPermissions(): Promise<void> {
    const { keys } = await fetchMyPermissions();
    permissions.value = new Set(keys);
    permissionsLoaded.value = true;
  }

  function reset(): void {
    permissions.value = new Set();
    permissionsLoaded.value = false;
  }

  const visibleMenu = computed<MenuEntry[]>(() =>
    MENU_REGISTRY.filter((entry) => features.value.has(entry.componentId) && permissions.value.has(entry.permission)),
  );

  function canAccess(entry: Pick<MenuEntry, "componentId" | "permission">): boolean {
    return features.value.has(entry.componentId) && permissions.value.has(entry.permission);
  }

  return {
    features,
    permissions,
    featuresLoaded,
    permissionsLoaded,
    loadFeatures,
    loadPermissions,
    reset,
    visibleMenu,
    canAccess,
  };
});
