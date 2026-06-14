export type WorkspaceType = 'PERSONAL' | 'SHARED';
export type MemberRole = 'ADMIN' | 'MEMBER';
export type WorkspaceColor =
  | 'RED' | 'ORANGE' | 'AMBER' | 'YELLOW' | 'GREEN' | 'TEAL'
  | 'BLUE' | 'SKY' | 'INDIGO' | 'VIOLET' | 'PINK' | 'ROSE' | 'GRAY';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  color: WorkspaceColor | null;
  role: MemberRole;
  memberCount?: number;
}

export interface Member {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: MemberRole;
}

export interface WorkspaceDetail extends Workspace {
  created?: string;
  isOwner: boolean;
  members: Member[];
}
