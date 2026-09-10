/** `erp-inventory`，只读用到的部分——逐字对应 `components/erp/inventory/contracts/inventory.openapi.yaml`。 */
import { authedFetch } from "./http";

export interface Balance {
  product_id: string;
  warehouse_id: string;
  on_hand_qty: string;
  reserved_qty: string;
  available_qty: string;
}

export interface Movement {
  id: string;
  product_id: string;
  warehouse_id: string;
  qty: string;
  reason: "RECEIVE" | "ISSUE" | "ADJUST_GAIN" | "ADJUST_LOSS";
  order_id: string;
  created_at: string;
}

export async function getBalance(productId: string, warehouseId: string): Promise<Balance> {
  const query = new URLSearchParams({ product_id: productId, warehouse_id: warehouseId });
  return authedFetch(`/erp/inventory/balances?${query.toString()}`) as Promise<Balance>;
}

export async function listMovements(params: { productId?: string; warehouseId?: string; cursor?: string } = {}): Promise<{
  movements: Movement[];
  next_cursor?: string;
}> {
  const query = new URLSearchParams();
  if (params.productId) query.set("product_id", params.productId);
  if (params.warehouseId) query.set("warehouse_id", params.warehouseId);
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return authedFetch(`/erp/inventory/movements${qs ? `?${qs}` : ""}`) as Promise<{ movements: Movement[]; next_cursor?: string }>;
}
