/**
 * `erp-sales`，逐字对应 `components/erp/sales/contracts/sales.openapi.yaml`。
 * ⚠️ 金额/数量一律 string（跨语言精度，导读"另外两条"）——前端展示时才
 * 转数字，不在传输层转。
 */
import { authedFetch } from "./http";

export type OrderStatus = "DRAFT" | "CONFIRMED" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "CLOSED" | "SUSPENDED";

export interface OrderItem {
  product_id: string;
  product_sku: string;
  product_name: string;
  qty: string;
  unit_price: string;
  discount: string;
  tax_rate: string;
  subtotal: string;
}

export interface Order {
  id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: string;
  owner_id: string;
  reservation_id: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ListOrdersResult {
  orders: Order[];
  next_cursor?: string;
}

export async function listOrders(params: { cursor?: string; statusFilter?: OrderStatus } = {}): Promise<ListOrdersResult> {
  const query = new URLSearchParams();
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.statusFilter) query.set("status_filter", params.statusFilter);
  const qs = query.toString();
  return authedFetch(`/erp/sales/orders${qs ? `?${qs}` : ""}`) as Promise<ListOrdersResult>;
}

export async function getOrder(id: string): Promise<Order> {
  return authedFetch(`/erp/sales/orders/${encodeURIComponent(id)}`) as Promise<Order>;
}

export async function confirmOrder(id: string): Promise<Order> {
  return authedFetch(`/erp/sales/orders/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotency_key: crypto.randomUUID() }),
  }) as Promise<Order>;
}

export async function shipOrder(id: string): Promise<Order> {
  return authedFetch(`/erp/sales/orders/${encodeURIComponent(id)}/ship`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotency_key: crypto.randomUUID() }),
  }) as Promise<Order>;
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  return authedFetch(`/erp/sales/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotency_key: crypto.randomUUID(), reason }),
  }) as Promise<Order>;
}
