/** `erp-finance`，只读用到的部分——逐字对应 `components/erp/finance/contracts/finance.openapi.yaml`。 */
import { authedFetch } from "./http";

export interface ARLedgerEntry {
  id: string;
  customer_id: string;
  entry_id: string;
  amount: string;
  reconciled_amount: string;
  created_at: string;
}

export async function listARLedger(params: { customerId?: string; cursor?: string } = {}): Promise<{
  entries: ARLedgerEntry[];
  next_cursor?: string;
}> {
  const query = new URLSearchParams();
  if (params.customerId) query.set("customer_id", params.customerId);
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return authedFetch(`/erp/finance/ar-ledger${qs ? `?${qs}` : ""}`) as Promise<{ entries: ARLedgerEntry[]; next_cursor?: string }>;
}
