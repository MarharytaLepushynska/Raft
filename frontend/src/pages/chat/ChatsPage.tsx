import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getWorkspaces } from '@/api/workspaces';
import { getWorkspaceChats } from '@/api/chat';
import { useAuth } from '@/auth/AuthContext';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { colorHex } from '@/lib/workspaceColors';
import type { ChatSummary } from '@/types/chat';
import type { Workspace } from '@/types/workspace';
import './ChatsPage.css';

/** The Chats page: a list of shared-space chats next to the open conversation. */
export function ChatsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const spaceParam = searchParams.get('space');
  const [sharedMap, setSharedMap] = useState<Record<string, Workspace>>({});
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getWorkspaces()
      .then((all) => {
        if (!active) return;
        const shared = all.filter((workspace) => workspace.type === 'SHARED');
        setSharedMap(Object.fromEntries(shared.map((workspace) => [workspace.id, workspace])));
        const target = spaceParam && shared.some((workspace) => workspace.id === spaceParam) ? spaceParam : null;
        setSelectedId((current) => target ?? current ?? shared[0]?.id ?? null);
        if (target) setChatOpen(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spaceParam]);

  useEffect(() => {
    let active = true;
    const load = () =>
      getWorkspaceChats()
        .then((all) => {
          if (active) setSummaries(all);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const chats = summaries.filter((chat) => sharedMap[chat.workspaceId]);
  const selected = selectedId ? sharedMap[selectedId] ?? null : null;

  const selectChat = (id: string) => {
    setSelectedId(id);
    setChatOpen(true);
    setSummaries((prev) => prev.map((chat) => (chat.workspaceId === id ? { ...chat, unreadCount: 0 } : chat)));
  };

  // on narrow screens go back to the list, on wide ones just collapse it
  const toggleList = () => {
    if (window.matchMedia('(max-width: 720px)').matches) {
      setChatOpen(false);
    } else {
      setCollapsed((value) => !value);
    }
  };

  return (
    <div className={`chats${collapsed ? ' chats--collapsed' : ''}${chatOpen ? ' chats--chat-open' : ''}`}>
      <aside className="chats__list">
        {chats.length === 0 ? (
          <p className="chats__muted">No shared spaces yet.</p>
        ) : (
          <ul className="chats__spaces">
            {chats.map((chat) => {
              const workspace = sharedMap[chat.workspaceId];
              const senderName = chat.lastMessageSender
                ? chat.lastMessageSender.id === user?.id
                  ? 'You'
                  : chat.lastMessageSender.firstName
                : null;
              const unread = chat.workspaceId === selectedId ? 0 : chat.unreadCount;
              return (
                <li key={chat.workspaceId}>
                  <button
                    type="button"
                    className={`chats__space${chat.workspaceId === selectedId ? ' chats__space--active' : ''}`}
                    onClick={() => selectChat(chat.workspaceId)}
                  >
                    <span className="chats__avatar" style={{ background: colorHex(workspace.color) }} />
                    <span className="chats__space-info">
                      <span className="chats__space-name">{chat.workspaceName}</span>
                      {chat.lastMessageContent && (
                        <>
                          {senderName && <span className="chats__space-sender">{senderName}</span>}
                          <span className="chats__space-preview">{chat.lastMessageContent}</span>
                        </>
                      )}
                    </span>
                    {unread > 0 && <span className="chats__unread">{unread}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div className="chats__panel">
        {selected ? (
          <ChatPanel
            key={selected.id}
            workspaceId={selected.id}
            workspaceName={selected.name}
            workspaceColor={selected.color}
            collapsed={collapsed}
            onToggleList={toggleList}
          />
        ) : (
          <p className="chats__muted chats__empty">Select a space to start chatting.</p>
        )}
      </div>
    </div>
  );
}
