import type { UserSummary } from '@/types/user';

export interface ChatMessage {
  id: string;
  workspaceId: string;
  workspaceName: string;
  sender: UserSummary;
  content: string;
  edited: boolean;
  ownMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  workspaceId: string;
  workspaceName: string;
  lastMessageId: string | null;
  lastMessageContent: string | null;
  lastMessageSender: UserSummary | null;
  lastMessageAt: string | null;
  unreadCount: number;
}
