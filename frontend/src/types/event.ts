import type { WorkspaceColor } from '@/types/workspace';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceColor?: WorkspaceColor | null;
}
