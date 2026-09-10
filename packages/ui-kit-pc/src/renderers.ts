/**
 * §12.6.2 的两件一次性接线活之二：把 AntDV 表单控件注册成 vxe 的全局渲染器，
 * 让 `<BeTable>` 的可编辑列直接用 `editRender: { name: 'BeInput' }` 这种
 * 我们自己的渲染器名字，单元格里出来的是真的 `<a-input>`，不是 vxe 自带的
 * 原生 input（那样字体/边框/焦点态会跟页面其它控件对不上——决策 111
 * 反复强调的"贴进页面里"症状）。
 *
 * ⚠️ 这里的三个 key（`renderEdit`/`renderCell`/`renderDefault`）不是猜的：
 * 读了 vxe-table@4.21.9 `es/table/src/cell.js` 的 `runRenderer`/`renderCell`
 * 两处真实调用点核对出来的——编辑态用 `renderEdit(renderOpts, params)`，
 * 非编辑态但列可编辑用 `renderCell`，纯展示列（`cellRender`，不可编辑）用
 * `renderDefault`。三者返回值都要是 VNode 或 VNode[]。
 */

import { h } from "vue";
import { Input, InputNumber, Select, DatePicker } from "ant-design-vue";
import { renderer, type VxeGlobalRendererHandles } from "vxe-table";
import dayjs, { type Dayjs } from "dayjs";

type EditParams = VxeGlobalRendererHandles.RenderEditParams;
type CellParams = VxeGlobalRendererHandles.RenderCellParams;
type EditOpts = VxeGlobalRendererHandles.RenderEditOptions;

function cellValue(params: EditParams | CellParams): unknown {
  const { row, column } = params as { row: Record<string, unknown>; column: { field: string } };
  return row[column.field];
}

function setCellValue(params: EditParams, val: unknown): void {
  const { row, column } = params as { row: Record<string, unknown>; column: { field: string } };
  row[column.field] = val;
}

function displayText(params: CellParams): string {
  const val = cellValue(params);
  return val === null || val === undefined || val === "" ? "" : String(val);
}

renderer.add("BeInput", {
  renderEdit(renderOpts: EditOpts, params: EditParams) {
    return h(Input, {
      value: cellValue(params) as string,
      "onUpdate:value": (val: string) => setCellValue(params, val),
      ...(renderOpts.props ?? {}),
    });
  },
  renderCell(_renderOpts: EditOpts, params: CellParams) {
    return h("span", displayText(params));
  },
});

renderer.add("BeInputNumber", {
  renderEdit(renderOpts: EditOpts, params: EditParams) {
    return h(InputNumber, {
      value: cellValue(params) as number,
      "onUpdate:value": (val: number) => setCellValue(params, val),
      style: { width: "100%" },
      ...(renderOpts.props ?? {}),
    });
  },
  renderCell(_renderOpts: EditOpts, params: CellParams) {
    return h("span", displayText(params));
  },
});

renderer.add("BeSelect", {
  renderEdit(renderOpts: EditOpts, params: EditParams) {
    const options = (renderOpts.options ?? []) as Array<{ label: string; value: unknown }>;
    return h(Select, {
      value: cellValue(params),
      "onUpdate:value": (val: unknown) => setCellValue(params, val),
      options,
      style: { width: "100%" },
      ...(renderOpts.props ?? {}),
    });
  },
  renderCell(renderOpts: EditOpts, params: CellParams) {
    const options = (renderOpts.options ?? []) as Array<{ label: string; value: unknown }>;
    const hit = options.find((o) => o.value === cellValue(params));
    return h("span", hit ? hit.label : displayText(params));
  },
});

renderer.add("BeDatePicker", {
  renderEdit(renderOpts: EditOpts, params: EditParams) {
    const raw = cellValue(params) as string | undefined;
    return h(DatePicker, {
      value: raw ? dayjs(raw) : undefined,
      "onUpdate:value": (val: Dayjs | undefined) => setCellValue(params, val ? val.format("YYYY-MM-DD") : ""),
      style: { width: "100%" },
      ...(renderOpts.props ?? {}),
    });
  },
  renderCell(_renderOpts: EditOpts, params: CellParams) {
    return h("span", displayText(params));
  },
});
