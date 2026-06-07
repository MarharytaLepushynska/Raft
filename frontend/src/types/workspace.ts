import type {User} from "@/types/user.ts";
export type WorkspaceType = 'PERSONAL' | 'SHARED';

export interface Workspace {
    id: string;
    name: string;
    type: WorkspaceType;
    owner: User;
    created: string;
}