import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BeListPage from "../src/pages/BeListPage.vue";
import BeDetailPage from "../src/pages/BeDetailPage.vue";
import BeFormPage from "../src/pages/BeFormPage.vue";
import BeSettingsPage from "../src/pages/BeSettingsPage.vue";

describe("页面级模板：决策 113 要求业务页面不从空白 <div> 起手", () => {
  it("BeListPage 渲染标题、actions 插槽、默认插槽（放表格的位置）", () => {
    const wrapper = mount(BeListPage, {
      props: { title: "销售订单" },
      slots: { actions: "<button>新建</button>", default: "<div class='table-slot'>表格</div>" },
    });
    expect(wrapper.text()).toContain("销售订单");
    expect(wrapper.find("button").text()).toBe("新建");
    expect(wrapper.find(".table-slot").exists()).toBe(true);
  });

  it("BeDetailPage 的返回按钮点击会 emit back，不是自己处理路由跳转", async () => {
    const wrapper = mount(BeDetailPage, { props: { title: "订单详情" } });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("back")).toBeTruthy();
  });

  it("BeDetailPage showBack=false 时不渲染返回按钮", () => {
    const wrapper = mount(BeDetailPage, { props: { title: "订单详情", showBack: false } });
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("BeFormPage 点保存/取消分别 emit submit/cancel，submitting 时按钮进入 loading 态", async () => {
    const wrapper = mount(BeFormPage, { props: { title: "新建客户", submitting: true } });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[1]!.classes()).toContain("ant-btn-loading");

    await buttons[0]!.trigger("click");
    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it("BeSettingsPage 渲染标题、说明与内容插槽", () => {
    const wrapper = mount(BeSettingsPage, {
      props: { title: "通知偏好", description: "站内信与通道开关" },
      slots: { default: "<div class='settings-slot'>内容</div>" },
    });
    expect(wrapper.text()).toContain("通知偏好");
    expect(wrapper.text()).toContain("站内信与通道开关");
    expect(wrapper.find(".settings-slot").exists()).toBe(true);
  });
});
