<script setup lang="ts">
/**
 * 覆盖 ~80% 用法的表格封装（§12.6.3、§12.6.6 step 4）：业务页面永远
 * 用 `<BeTable>`，不直接 `import` `<vxe-grid>`——换表格引擎只改这一个文件。
 *
 * ⚠️ 刻意不用 vxe-grid 自带的 `proxyConfig`（页码式分页 `currentPage`/
 * `total`）做数据请求：本项目的 List 契约是游标分页，深分页在契约层面
 * 就不可表达（根 AGENTS.md 決策 53："List 不给 offset 字段"）。
 * 页码式分页需要一个可靠的 `total` 才能算页数，游标分页天然没有
 * （只有"还有没有下一页"）。所以数据获取与翻页逻辑归调用方
 * （`BeListPage`），本组件只管"给我 `data` 我就渲染"，`data` 由外部
 * 整体替换，不是增量 insert。
 *
 * 逃生口：如果某个页面绕过 BeTable 直接用 `<vxe-grid>`/`<vxe-table>`，
 * 必须在 `ui-kit-pc/README.md` 记一行（§12.6.6 判据："这份清单必须数得清"）。
 */
import { computed, useTemplateRef } from "vue";
import { VxeGrid, type VxeGridInstance, type VxeGridPropTypes, type VxeTableDefines, type VxeTablePropTypes } from "vxe-table";

export interface BeTableProps {
  columns: VxeGridPropTypes.Columns;
  data: Record<string, unknown>[];
  loading?: boolean;
  /** 行唯一标识字段，勾选/展开等功能都依赖它 */
  rowKey?: string;
  /** 开启单元格编辑（列自己再决定要不要给 editRender） */
  editable?: boolean;
  /** 需要显式给高度才会触发虚拟滚动（vxe 的既有约束，不是本组件加的限制） */
  height?: VxeTablePropTypes.Height;
  showToolbar?: boolean;
  toolbarTitle?: string;
}

const props = withDefaults(defineProps<BeTableProps>(), {
  loading: false,
  rowKey: "id",
  editable: false,
  height: undefined,
  showToolbar: true,
  toolbarTitle: "",
});

const emit = defineEmits<{ refresh: []; "row-click": [row: Record<string, unknown>] }>();

/**
 * 不依赖 Vue 的"未声明 emit 自动穿透到唯一根节点"去接 vxe 的 `cell-click`——
 * 真机 + `@vue/test-utils` 都验过，穿透到 `<vxe-grid>` 后**vxe 内部的
 * `cell-click` 未必会被真的触发**（它自己的点击处理是内部逻辑判定的，
 * 不是单纯监听原生 DOM click 转发），显式接住再转成语义更简单的
 * `row-click` 是唯一验证过确实可靠的路径。
 */
function onCellClick(params: VxeTableDefines.CellClickEventParams): void {
  emit("row-click", params.row as Record<string, unknown>);
}

const gridRef = useTemplateRef<VxeGridInstance>("gridRef");

const rowConfig = computed<VxeTablePropTypes.RowConfig>(() => ({ keyField: props.rowKey, isHover: true }));
const editConfig = computed<VxeTablePropTypes.EditConfig | undefined>(() =>
  props.editable ? { trigger: "click", mode: "cell" } : undefined,
);
const toolbarConfig = computed<VxeGridPropTypes.ToolbarConfig | undefined>(() =>
  props.showToolbar
    ? {
        refresh: true,
        refreshOptions: { queryMethod: () => emit("refresh") },
        custom: true,
        zoom: false,
      }
    : undefined,
);

defineExpose({
  /** 逃生口用：真需要调 vxe 原生方法时通过这个 ref，而不是业务页面自己 import vxe-grid */
  grid: gridRef,
});
</script>

<template>
  <vxe-grid
    ref="gridRef"
    :columns="columns"
    :data="data"
    :loading="loading"
    :height="height"
    :row-config="rowConfig"
    :edit-config="editConfig"
    :toolbar-config="toolbarConfig"
    :column-config="{ resizable: true }"
    :tooltip-config="{ mode: 'title' }"
    border
    round
    stripe
    show-overflow
    @cell-click="onCellClick"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps" :key="slotName">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </vxe-grid>
</template>
