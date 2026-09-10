/** `infra-workflow`，逐字对应 `components/infra/workflow/contracts/workflow.openapi.yaml`。 */
import { authedFetch } from "./http";

export type TaskType = "APPROVAL" | "EXCEPTION";
export type TaskStatus = "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED" | "CANCELLED";

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  assignee_sub: string;
  assignee_dept_path: string;
  title: string;
  summary: Record<string, unknown>;
  source_component: string;
  deep_link: string;
  due_at: string | null;
  created_at: string;
}

export interface TaskAction {
  actor_sub: string;
  action: "APPROVED" | "REJECTED" | "CLOSED" | "CANCELLED";
  comment: string;
  created_at: string;
}

export interface TaskDetail extends Task {
  actions: TaskAction[];
}

export async function listMyTasks(params: { status?: TaskStatus; cursor?: string } = {}): Promise<{ tasks: Task[]; next_cursor?: string }> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return authedFetch(`/infra/workflow/tasks${qs ? `?${qs}` : ""}`) as Promise<{ tasks: Task[]; next_cursor?: string }>;
}

export async function getTask(id: string): Promise<TaskDetail> {
  return authedFetch(`/infra/workflow/tasks/${encodeURIComponent(id)}`) as Promise<TaskDetail>;
}

export async function approveTask(id: string, comment?: string): Promise<TaskDetail> {
  return authedFetch(`/infra/workflow/tasks/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ comment }),
  }) as Promise<TaskDetail>;
}

export async function rejectTask(id: string, comment: string): Promise<TaskDetail> {
  return authedFetch(`/infra/workflow/tasks/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ comment }),
  }) as Promise<TaskDetail>;
}
