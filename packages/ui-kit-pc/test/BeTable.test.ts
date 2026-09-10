import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import BeTable from "../src/components/BeTable.vue";
import type { VxeGridInstance } from "vxe-table";

const columns = [
  { field: "name", title: "名称" },
  { field: "status", title: "状态" },
];

const data = [
  { id: "1", name: "客户 A", status: "启用" },
  { id: "2", name: "客户 B", status: "停用" },
];

/** vxe-grid 内部渲染是异步的，等够两轮 microtask 再断言 DOM，否则会看到中间态。 */
async function flush() {
  await nextTick();
  await nextTick();
}

describe("BeTable", () => {
  it("真实挂载后渲染出表头与行数据（不是只测 props 有没有传进去）", async () => {
    const wrapper = mount(BeTable, { props: { columns, data } });
    await flush();

    const html = wrapper.html();
    expect(html).toContain("名称");
    expect(html).toContain("状态");
    expect(html).toContain("客户 A");
    expect(html).toContain("客户 B");
  });

  it("工具栏刷新按钮点击后，父组件能收到 refresh 事件（不是内部自己吞掉）", async () => {
    const wrapper = mount(BeTable, { props: { columns, data, showToolbar: true } });
    await flush();

    const refreshBtn = wrapper.find('button[title="刷新"]');
    expect(refreshBtn.exists(), wrapper.html()).toBe(true);
    await refreshBtn.trigger("click");

    expect(wrapper.emitted("refresh")).toBeTruthy();
  });

  it("showToolbar=false 时整个工具栏容器都不在 DOM 里", async () => {
    const wrapper = mount(BeTable, { props: { columns, data, showToolbar: false } });
    await flush();
    expect(wrapper.find(".vxe-grid--toolbar-wrapper").exists()).toBe(false);
  });

  it("editable=true 时把 editConfig 真的传给了 vxe-grid", async () => {
    const wrapper = mount(BeTable, { props: { columns, data, editable: true } });
    await flush();
    const grid = (wrapper.vm as unknown as { grid: VxeGridInstance | null }).grid;
    expect(grid!.props.editConfig).toMatchObject({ trigger: "click", mode: "cell" });
  });

  it("点击某一行的单元格会 emit row-click，带上那一行的数据", async () => {
    const wrapper = mount(BeTable, { props: { columns, data } });
    await flush();

    const cell = wrapper.find(".vxe-body--column");
    expect(cell.exists(), wrapper.html()).toBe(true);
    await cell.trigger("click");

    const emitted = wrapper.emitted("row-click");
    expect(emitted, wrapper.html()).toBeTruthy();
    expect(emitted![0]![0]).toMatchObject({ id: "1", name: "客户 A" });
  });

  it("暴露 grid ref 供逃生口使用，且 getData() 与传入的 data 一致", async () => {
    const wrapper = mount(BeTable, { props: { columns, data } });
    await flush();
    const grid = (wrapper.vm as unknown as { grid: VxeGridInstance | null }).grid;
    expect(grid).toBeTruthy();
    expect(grid!.getData()).toEqual(data);
  });
});
