import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkspace } from '@/api/workspaces';
import { useAuth } from '@/auth/AuthContext';
import { Icon } from '@/lib/icons';
import { colorHex } from '@/lib/workspaceColors';
import type { ChatMessage } from '@/types/chat';
import type { WorkspaceDetail } from '@/types/workspace';
import './ChatDetails.css';

interface ChatDetailsProps {
  workspaceId: string;
  messages: ChatMessage[];
  onClose: () => void;
}

/** Finds the member who sent the most messages. */
function mostActive(messages: ChatMessage[]): { name: string; count: number } | null {
  const counts = new Map<string, { name: string; count: number }>();
  for (const message of messages) {
    const current = counts.get(message.sender.id);
    counts.set(message.sender.id, { name: message.sender.firstName, count: (current?.count ?? 0) + 1 });
  }
  let top: { name: string; count: number } | null = null;
  for (const entry of counts.values()) {
    if (top === null || entry.count > top.count) top = entry;
  }
  return top;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Modal with the space's chat details: members (admins first), the most active member, and an "open space" button. */
export function ChatDetails({ workspaceId, messages, onClose }: ChatDetailsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);

  useEffect(() => {
    let active = true;
    getWorkspace(workspaceId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const members = detail
    ? [...detail.members].sort((a, b) => (a.role === 'ADMIN' ? 0 : 1) - (b.role === 'ADMIN' ? 0 : 1))
    : [];
  const top = mostActive(messages);

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__scrim" onClick={onClose} />
      <div className="modal__card chat-details">
        <button type="button" className="chat-details__close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>

        <div className="chat-details__hero">
          <span className="chat-details__hero-avatar" style={{ background: colorHex(detail?.color) }} />
          <div className="chat-details__hero-text">
            <h2 className="chat-details__title">{detail?.name ?? 'Chat'}</h2>
            {detail?.created && <p className="chat-details__created">Created {formatDate(detail.created)}</p>}
          </div>
        </div>

        {detail && (
          <>
            {top && (
              <div className="chat-details__active">
                <Icon name="circle-star" size={18} className="chat-details__active-medal" />
                <span className="chat-details__active-label">Most active</span>
                <span className="chat-details__active-value">
                  {top.name} &middot; {top.count}
                </span>
              </div>
            )}

            <div className="chat-details__section-head">
              <span className="chat-details__section-title">Members</span>
              <span className="chat-details__section-count">{members.length}</span>
            </div>

            <ul className="chat-details__members">
              {members.map((member) => {
                const isYou = member.userId === user?.id;
                return (
                  <li key={member.id} className="chat-details__member">
                    {member.avatar ? (
                      <img className="chat-details__avatar" src={member.avatar} alt={member.username} />
                    ) : (
                      <span className="chat-details__avatar chat-details__avatar--initials">
                        {((member.firstName[0] ?? '') + (member.lastName[0] ?? '')).toUpperCase()}
                      </span>
                    )}
                    <div className="chat-details__member-info">
                      <span className="chat-details__member-name">
                        <span className="chat-details__member-fullname">
                          {member.firstName} {member.lastName}
                        </span>
                        {isYou && <span className="chat-details__you">you</span>}
                      </span>
                      <span className="chat-details__username">@{member.username}</span>
                    </div>
                    {member.role === 'ADMIN' && <span className="chat-details__role">admin</span>}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="chat-details__open"
              onClick={() => {
                navigate(`/spaces/${workspaceId}`);
                onClose();
              }}
            >
              Open space
            </button>
          </>
        )}
      </div>
    </div>
  );
}
