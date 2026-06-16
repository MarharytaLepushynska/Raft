import type { UserSummary } from '@/types/user';

/** A single message in a workspace chat. */
export interface ChatMessage {
  id: string;
  workspaceId: string;
  workspaceName: string;
  sender: UserSummary;
  content: string;
  /** True if the message was edited after sending. */
  edited: boolean;
  /** True if the current user is the sender (used to align/style own bubbles). */
  ownMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One row of the chat list: a workspace plus its last-message preview and unread count. */
export interface ChatSummary {
  workspaceId: string;
  workspaceName: string;
  lastMessageId: string | null;
  lastMessageContent: string | null;
  lastMessageSender: UserSummary | null;
  lastMessageAt: string | null;
  unreadCount: number;
}
