import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { useChat } from '@/hooks/chat/useChat';
import { ChatDetails } from '@/components/chat/ChatDetails';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Icon } from '@/lib/icons';
import { colorHex } from '@/lib/workspaceColors';
import { toISODate } from '@/lib/calendar';
import type { ChatMessage } from '@/types/chat';
import type { WorkspaceColor } from '@/types/workspace';
import './ChatPanel.css';

interface ChatPanelProps {
  workspaceId: string;
  workspaceName: string;
  workspaceColor?: WorkspaceColor | null;
  collapsed: boolean;
  onToggleList: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function menuPosition(event: { clientX: number; clientY: number }): { x: number; y: number } {
  return {
    x: Math.min(event.clientX, window.innerWidth - 170),
    y: Math.min(event.clientY, window.innerHeight - 150),
  };
}

/** Groups consecutive messages from the same sender together. */
function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  for (const message of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].sender.id === message.sender.id && last[0].ownMessage === message.ownMessage) {
      last.push(message);
    } else {
      groups.push([message]);
    }
  }
  return groups;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const key = toISODate(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key === toISODate(today)) return 'Today';
  if (key === toISODate(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** The chat panel: message bubbles with date dividers, a copy/edit/delete menu, and the compose box. */
export function ChatPanel({ workspaceId, workspaceName, workspaceColor, collapsed, onToggleList }: ChatPanelProps) {
  const { messages, send, edit, remove } = useChat(workspaceId);
  const [text, setText] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    document.addEventListener('contextmenu', close);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('contextmenu', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');
    if (editingId) {
      const id = editingId;
      setEditingId(null);
      await edit(id, content);
    } else {
      await send(content);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard?.writeText(content);
    setMenu(null);
  };

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id);
    setText(message.content);
    setMenu(null);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText('');
  };

  const askDelete = (id: string) => {
    setMenu(null);
    setConfirmDeleteId(id);
  };

  const groups = groupMessages(messages);
  const activeMessage = menu ? messages.find((message) => message.id === menu.id) ?? null : null;

  return (
    <section className="chat">
      <header className="chat__head">
        <button
          type="button"
          className="chat__toggle"
          onClick={onToggleList}
          aria-label={collapsed ? 'Show chats list' : 'Hide chats list'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={18} />
        </button>
        <span className="chat__title">{workspaceName}</span>
        <button
          type="button"
          className="chat__head-avatar"
          style={{ background: colorHex(workspaceColor) }}
          onClick={() => setDetailsOpen(true)}
          aria-label="Chat details"
        />
      </header>

      <div className="chat__messages" onScroll={() => setMenu(null)}>
        {groups.map((group, index) => {
          const own = group[0].ownMessage;
          const sender = group[0].sender;
          const name = `${sender.firstName} ${sender.lastName}`;
          const showDivider =
            index === 0 ||
            toISODate(new Date(group[0].createdAt)) !== toISODate(new Date(groups[index - 1][0].createdAt));
          return (
            <Fragment key={group[0].id}>
              {showDivider && <div className="chat__day">{dayLabel(group[0].createdAt)}</div>}
              <div className={`chat__group${own ? ' chat__group--own' : ''}`}>
                {!own &&
                  (sender.avatar ? (
                    <img className="chat__avatar" src={sender.avatar} alt={name} />
                  ) : (
                    <span className="chat__avatar chat__avatar--initials">
                      {((sender.firstName[0] ?? '') + (sender.lastName[0] ?? '')).toUpperCase()}
                    </span>
                  ))}
                <div className="chat__stack">
                  {group.map((message, index) => (
                    <div
                      key={message.id}
                      className="chat__bubble"
                      onClick={(event) => {
                        event.stopPropagation();
                        const pos = menuPosition(event);
                        setMenu((current) => (current?.id === message.id ? null : { id: message.id, ...pos }));
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setMenu({ id: message.id, ...menuPosition(event) });
                      }}
                    >
                      {!own && index === 0 && <span className="chat__sender">{sender.firstName}</span>}
                      <span className="chat__text">
                        {message.content}
                        {message.edited && <span className="chat__edited"> (edited)</span>}
                      </span>
                      <span className="chat__time">{formatTime(message.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      <form className="chat__compose" onSubmit={submit}>
        {editingId && (
          <div className="chat__editing">
            <span className="chat__editing-label">Editing message</span>
            <button type="button" className="chat__editing-cancel" onClick={cancelEdit} aria-label="Cancel editing">
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
        <div className="chat__compose-row">
          <input
            ref={inputRef}
            className="chat__input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message&hellip;"
            maxLength={3000}
          />
          <button type="submit" className="chat__send" disabled={!text.trim()} aria-label="Send">
            <Icon name="send" size={18} />
          </button>
        </div>
      </form>

      {menu && activeMessage && (
        <div
          className="chat__menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.stopPropagation()}
        >
          <button type="button" className="chat__action" onClick={() => copyMessage(activeMessage.content)}>
            Copy
          </button>
          {activeMessage.ownMessage && (
            <button type="button" className="chat__action" onClick={() => startEdit(activeMessage)}>
              Edit
            </button>
          )}
          {activeMessage.ownMessage && (
            <button
              type="button"
              className="chat__action chat__action--danger"
              onClick={() => askDelete(activeMessage.id)}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {detailsOpen && (
        <ChatDetails workspaceId={workspaceId} messages={messages} onClose={() => setDetailsOpen(false)} />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete message?"
          text="Are you sure? This can&rsquo;t be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            remove(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </section>
  );
}
