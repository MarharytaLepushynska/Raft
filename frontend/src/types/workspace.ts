/** `PERSONAL` (solo, no chat/members) or `SHARED` (collaborative). */
export type WorkspaceType = 'PERSONAL' | 'SHARED';
export type MemberRole = 'ADMIN' | 'MEMBER';
/** Accent color name a workspace can be tagged with (see `WORKSPACE_COLORS`). */
export type WorkspaceColor =
  | 'RED' | 'ORANGE' | 'AMBER' | 'YELLOW' | 'GREEN' | 'TEAL'
  | 'BLUE' | 'SKY' | 'INDIGO' | 'VIOLET' | 'PINK' | 'ROSE' | 'GRAY';

/** A workspace as shown in lists, with the current user's role in it. */
export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  color: WorkspaceColor | null;
  role: MemberRole;
  memberCount?: number;
}

/** A member of a shared workspace. */
export interface Member {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: MemberRole;
}

/** A workspace with its full member list (the single-workspace view). */
export interface WorkspaceDetail extends Workspace {
  created?: string;
  isOwner: boolean;
  members: Member[];
}
