import { api } from '@/api/http';
import type { ChatMessage, ChatSummary } from '@/types/chat';

/** Lists the user's workspace chats with last-message preview and unread count. */
export function getWorkspaceChats(): Promise<ChatSummary[]> {
  return api.get<ChatSummary[]>('/chats/workspaces');
}

/** Marks a workspace's chat as read (resets its unread count). */
export function markChatRead(workspaceId: string): Promise<void> {
  return api.post<void>(`/chats/workspaces/${workspaceId}/read`);
}

/** Fetches the latest `limit` messages of a workspace chat. */
export function getMessages(workspaceId: string, limit = 50): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/chats/workspaces/${workspaceId}/messages?limit=${limit}`);
}

/** Sends a message to a workspace chat. */
export function sendMessage(workspaceId: string, content: string): Promise<ChatMessage> {
  return api.post<ChatMessage>(`/chats/workspaces/${workspaceId}/messages`, { content });
}

/** Edits the text of an existing message. */
export function updateMessage(messageId: string, content: string): Promise<ChatMessage> {
  return api.patch<ChatMessage>(`/chats/messages/${messageId}`, { content });
}

/** Deletes a message by id. */
export function deleteMessage(messageId: string): Promise<void> {
  return api.delete<void>(`/chats/messages/${messageId}`);
}
