/**
 * `infra-print` 的 `POST /infra/print/render`。响应体是原始字节流
 * （PDF），不是 JSON——单独写而不是复用 `authedFetch`，因为那个函数
 * 的返回值约定是"解析过的 JSON/文本"，硬塞二进制会把这份契约搞脏。
 * 代价是这里没有 `authedFetch` 的 401 静默刷新重试——可接受：打印失败
 * 用户自己再点一次，不是静默失败的路径。
 *
 * ⚠️ `templateId` 假设 `infra-print` 已经通过它自己的模板管理接口
 * （`PUT /infra/print/templates/{id}`）上传了一份 `sales.delivery_note`
 * 模板——这份实现范围内没有播种任何默认模板（模板管理是独立的管理员
 * 操作，不在本次前端骨架任务范围），真机联调前必须先确认这个模板存在，
 * 否则会拿到一个"模板不存在"的错误，不是本按钮本身接线错了。
 */
import { getConfig } from "../config";
import { useAuthStore } from "../stores/auth";

const DELIVERY_NOTE_TEMPLATE_ID = "sales.delivery_note";

export async function renderDeliveryNote(order: {
  order_no: string;
  customer_name: string;
  items: Array<{ product_name: string; qty: string; unit_price: string; subtotal: string }>;
  total_amount: string;
}): Promise<Blob> {
  const auth = useAuthStore();
  const resp = await fetch(new URL("/infra/print/render", window.location.origin + getConfig().gatewayBaseUrl), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth.authHeader() },
    body: JSON.stringify({ template_id: DELIVERY_NOTE_TEMPLATE_ID, data: order }),
  });
  if (!resp.ok) {
    throw new Error(`打印渲染失败：HTTP ${resp.status}`);
  }
  return resp.blob();
}
