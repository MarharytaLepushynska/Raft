import type {User} from "@/types/user.ts";
import type {Folder} from "@/types/folder.ts";

export interface Note {
    id: string;
    folder: Folder;
    creator: User;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface PinnedNote extends Note {
    pinned: boolean;
}