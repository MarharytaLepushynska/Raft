import { useCallback, useEffect, useState } from 'react';
import { getMessages, sendMessage, updateMessage, deleteMessage, markChatRead } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';

const POLL_MS = 5000;

export function useChat(workspaceId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const load = useCallback(
    () =>
      getMessages(workspaceId)
        .then((all) => {
          setMessages([...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
          markChatRead(workspaceId).catch(() => {});
        })
        .catch(() => {}),
    [workspaceId],
  );

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const send = async (content: string) => {
    await sendMessage(workspaceId, content);
    await load();
  };

  const edit = async (messageId: string, content: string) => {
    await updateMessage(messageId, content);
    await load();
  };

  const remove = async (messageId: string) => {
    await deleteMessage(messageId);
    await load();
  };

  return { messages, send, edit, remove };
}
