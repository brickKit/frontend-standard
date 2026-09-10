/** `mdm-product`，只读用到的部分——逐字对应 `components/mdm/product/contracts/product.openapi.yaml`。 */
import { authedFetch } from "./http";

export interface Product {
  id: string;
  sku: string;
  name: string;
  base_uom_id: string;
  tracking_type: "NONE" | "BATCH" | "SERIAL";
  standard_cost: string;
  status: "ACTIVE" | "DISABLED";
  created_at: string;
}

export async function listProducts(cursor?: string): Promise<{ products: Product[]; next_cursor?: string }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return authedFetch(`/mdm/product/products${qs}`) as Promise<{ products: Product[]; next_cursor?: string }>;
}
