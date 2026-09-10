/** `infra-notification`，逐字对应 `components/infra/notification/contracts/notification.openapi.yaml`。 */
import { authedFetch } from "./http";

export type Channel = "IM" | "EMAIL" | "SMS";
export type RecordStatus = "PENDING" | "ACCEPTED" | "SENT" | "FAILED_PERMANENT" | "SUPPRESSED" | "RETRYING";

export interface NotificationRecord {
  id: string;
  category: string;
  channel: Channel;
  title: string;
  body: string;
  status: RecordStatus;
  created_at: string;
}

export interface Preferences {
  sub: string;
  global_channels: Channel[];
  category_channels: Record<string, Channel[]>;
}

export async function listNotifications(cursor?: string): Promise<{ records: NotificationRecord[]; next_cursor?: string }> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return authedFetch(`/infra/notification/notifications${qs}`) as Promise<{
    records: NotificationRecord[];
    next_cursor?: string;
  }>;
}

export async function getPreferences(): Promise<Preferences> {
  return authedFetch("/infra/notification/preferences") as Promise<Preferences>;
}

export async function setPreferences(update: { global_channels?: Channel[]; category_channels?: Record<string, Channel[]> }): Promise<Preferences> {
  return authedFetch("/infra/notification/preferences", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(update),
  }) as Promise<Preferences>;
}
