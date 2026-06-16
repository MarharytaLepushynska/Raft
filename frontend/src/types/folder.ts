import type { WorkspaceColor, WorkspaceType } from '@/types/workspace';
import type {UserSummary} from "@/types/user";
export type FolderType = 'PERSONAL' | 'SHARED';

/** A folder that groups notes within a workspace. */
export interface Folder {
    id: string;
    name: string;
    folderType: FolderType;
    created: string;
    workspaceId: string;
    workspaceName: string;
    workspaceColor?: WorkspaceColor | null;
    workspaceType: WorkspaceType;
    owner: UserSummary;
    canEdit: boolean;
}

/** Payload to create a folder. */
export type CreateFolderInput = {
    name: string;
    type: FolderType;
    workspaceId: string;
};

/** Payload to rename a folder. */
export type UpdateFolderInput = {
    name?: string;
};