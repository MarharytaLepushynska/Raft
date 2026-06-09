import type { WorkspaceColor, WorkspaceType } from '@/types/workspace';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskState = 'upcoming' | 'overdue' | 'done';

export interface TaskUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
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
