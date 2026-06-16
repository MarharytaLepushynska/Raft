import type { WorkspaceColor, WorkspaceType } from '@/types/workspace';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
/** Derived display state (computed from status + due date), not stored on the backend. */
export type TaskState = 'upcoming' | 'overdue' | 'done';

/** Minimal user info attached to a task (creator/assignee). */
export interface TaskUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/** A task with its schedule, status, assignment, and the workspace it belongs to. */
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  /** Due date as `YYYY-MM-DD`. */
  dueDate: string;
  /** Optional due time as `HH:mm`; absent means an all-day task. */
  dueTime?: string;
  status: TaskStatus;
  workspaceId?: string;
  workspaceName?: string;
  workspaceColor?: WorkspaceColor | null;
  workspaceType?: WorkspaceType;
  created?: string;
  creator?: TaskUser;
  assignee?: TaskUser;
  assigneeId?: string;
}
