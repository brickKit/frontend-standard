/** 同 `apps/pc` 的 `api/notification.ts`——逐字对应 `infra-notification` 契约。 */
import { authedFetch } from "./http";

export type RecordStatus = "PENDING" | "ACCEPTED" | "SENT" | "FAILED_PERMANENT" | "SUPPRESSED" | "RETRYING";

export interface NotificationRecord {
  id: string;
  category: string;
  channel: "IM" | "EMAIL" | "SMS";
  title: string;
  body: string;
  status: RecordStatus;
  created_at: string;
}

export async function listNotifications(cursor?: string): Promise<{ records: NotificationRecord[]; next_cursor?: string }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return authedFetch(`/infra/notification/notifications${qs}`) as Promise<{
    records: NotificationRecord[];
    next_cursor?: string;
  }>;
}
