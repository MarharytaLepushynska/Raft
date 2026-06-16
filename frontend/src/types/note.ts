import type {UserSummary} from "@/types/user";
import type {FolderType} from "@/types/folder";

/** A note inside a folder. */
export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    folderId: string;
    folderName: string;
    folderType: FolderType;
    creator: UserSummary;
    /** Whether the current user may edit it (false for others' notes in shared folders). */
    canEdit: boolean;
}

/** Payload to create a note. */
export type CreateNoteInput = {
    title: string;
    content?: string;
    folderId: string;
};

/** Payload to update a note's title/content. */
export type UpdateNoteInput = {
    title?: string;
    content?: string;
};