/** `mdm-customer`，只读用到的部分——逐字对应 `components/mdm/customer/contracts/customer.openapi.yaml`。 */
import { authedFetch } from "./http";

export interface Customer {
  id: string;
  code: string;
  name: string;
  tax_no: string;
  credit_limit: string;
  status: "ACTIVE" | "DISABLED";
  contacts: Array<{ id: string; name: string; phone: string; email: string; primary: boolean }>;
  billing_infos: Array<{ id: string; title: string; tax_no: string; bank_name: string; bank_account: string }>;
  created_at: string;
}

export async function listCustomers(cursor?: string): Promise<{ customers: Customer[]; next_cursor?: string }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return authedFetch(`/mdm/customer/customers${qs}`) as Promise<{ customers: Customer[]; next_cursor?: string }>;
}

export async function getCustomer(id: string): Promise<Customer> {
  return authedFetch(`/mdm/customer/customers/${encodeURIComponent(id)}`) as Promise<Customer>;
}
