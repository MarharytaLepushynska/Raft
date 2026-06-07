import type {User} from "@/types/user.ts";
export type FolderType = 'PERSONAL' | 'SHARED';

export interface Folder {
    id: string;
    name: string;
    type: FolderType;
    owner: User;
    created: string;
}