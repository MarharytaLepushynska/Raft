import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/lib/icons';
import { errorMessage } from '@/api/http';
import { addMember, removeMember } from '@/api/workspaces';
import { UserSuggestions } from '@/components/common/UserSuggestions';
import { useUserSuggestions } from '@/hooks/common/useUserSuggestions';
import type { Member } from '@/types/workspace';
import './WorkspaceMembers.css';

interface WorkspaceMembersProps {
  workspaceId: string;
  members: Member[];
  canManage: boolean;
  currentUserId?: string;
  onChange: (members: Member[]) => void;
}

export function WorkspaceMembers({ workspaceId, members, canManage, currentUserId, onChange }: WorkspaceMembersProps) {
  const [inviteLogin, setInviteLogin] = useState('');
  const [memberError, setMemberError] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const suggestions = useUserSuggestions(inviteLogin);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    const value = inviteLogin.trim();
    if (!value) return;
    try {
      const member = await addMember(workspaceId, value);
      onChange([...members, member]);
      setInviteLogin('');
      setMemberError('');
    } catch (err) {
      setMemberError(errorMessage(err));
    }
  };

  const kick = async (userId: string) => {
    try {
      await removeMember(workspaceId, userId);
      onChange(members.filter((m) => m.userId !== userId));
      setMemberError('');
    } catch (err) {
      setMemberError(errorMessage(err));
    }
  };

  return (
    <section className="wpage__members-widget">
      <h2 className="wpage__subtitle">Members ({members.length})</h2>
      {memberError && <div className="wpage__error">{memberError}</div>}
      <ul className="wpage__members">
        {members.map((member) => {
          const isYou = member.userId === currentUserId;
          return (
            <li key={member.id} className="wpage__member">
              <span className="wpage__avatar">
                {(member.firstName[0] ?? '') + (member.lastName[0] ?? '')}
              </span>
              <div className="wpage__member-info">
                <span className="wpage__member-name">
                  {member.firstName} {member.lastName}
                  {isYou && <span className="wpage__you"> (you)</span>}
                </span>
                <span className="wpage__member-username">@{member.username}</span>
              </div>
              {canManage && member.role !== 'ADMIN' && (
                <button
                  type="button"
                  className="wpage__member-remove"
                  aria-label={`Remove ${member.firstName}`}
                  onClick={() => kick(member.userId)}
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canManage && (
        <form className="wpage__invite" onSubmit={invite}>
          <div className="wpage__invite-field">
            <input
              ref={inviteInputRef}
              type="text"
              placeholder="Invite by login"
              autoComplete="off"
              value={inviteLogin}
              onChange={(event) => {
                setInviteLogin(event.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setShowSuggest(false)}
            />
            {showSuggest && (
              <UserSuggestions
                anchorRef={inviteInputRef}
                users={suggestions.filter((u) => !members.some((m) => m.username === u.username))}
                onPick={(u) => {
                  setInviteLogin(u.username);
                  setShowSuggest(false);
                }}
              />
            )}
          </div>
          <button type="submit" disabled={!inviteLogin.trim()}>
            Add
          </button>
        </form>
      )}
    </section>
  );
}
