import { api } from '@/api/http';
import type { ChatMessage, ChatSummary } from '@/types/chat';

export function getWorkspaceChats(): Promise<ChatSummary[]> {
  return api.get<ChatSummary[]>('/chats/workspaces');
}

export function markChatRead(workspaceId: string): Promise<void> {
  return api.post<void>(`/chats/workspaces/${workspaceId}/read`);
}

export function getMessages(workspaceId: string, limit = 50): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/chats/workspaces/${workspaceId}/messages?limit=${limit}`);
}

export function sendMessage(workspaceId: string, content: string): Promise<ChatMessage> {
  return api.post<ChatMessage>(`/chats/workspaces/${workspaceId}/messages`, { content });
}

export function updateMessage(messageId: string, content: string): Promise<ChatMessage> {
  return api.patch<ChatMessage>(`/chats/messages/${messageId}`, { content });
}

export function deleteMessage(messageId: string): Promise<void> {
  return api.delete<void>(`/chats/messages/${messageId}`);
}
