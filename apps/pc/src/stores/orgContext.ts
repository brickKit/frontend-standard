/**
 * 组织/法人切换器（§3.5，替代 AWS 的 Region 切换器）。
 *
 * ⚠️ 真实核对过 `erp-finance` 的 `contracts/finance.openapi.yaml`：
 * `ListARLedger` 等读接口的 query 参数里**没有** `legal_entity_id`
 * 这个位置——法人维度的行级过滤是 `besdk.ScopeOf` 在服务端按 JWT 里的
 * `org_id`/`dept_path` 派生的（同 org/owner 两维数据权限的既有心智模型），
 * 不是客户端传参能覆盖的。所以这个 store 目前**只是 UI 状态**（右上角
 * 显示当前法人、供切换时展示用），还没有真正影响任何请求的行为——
 * 一个人如果真的横跨多个法人，现在的后端契约下"切换"不改变任何查询
 * 结果，这是本次实现诚实记录的一个真实缺口，不是假装做完了 | 阶段三
 * Task 12（如需要真正的多法人切换生效，得先给 erp-finance 加一个覆盖
 * 参数或类似机制，不在本次改动范围）。
 */
import { defineStore } from "pinia";
import { ref } from "vue";

export const useOrgContextStore = defineStore("orgContext", () => {
  const currentLegalEntity = ref<string>("默认法人");
  function setCurrentLegalEntity(name: string): void {
    currentLegalEntity.value = name;
  }
  return { currentLegalEntity, setCurrentLegalEntity };
});
