import { useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@/types/user';
import './UserSuggestions.css';

interface UserSuggestionsProps {
  users: User[];
  onPick: (user: User) => void;
  anchorRef: RefObject<HTMLElement | null>;
}

export function UserSuggestions({ users, onPick, anchorRef }: UserSuggestionsProps) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, users.length]);

  if (users.length === 0 || !pos) return null;

  return createPortal(
    <ul className="usuggest" style={{ top: pos.top, left: pos.left, width: pos.width }}>
      {users.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            className="usuggest__item"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(user);
            }}
          >
            {user.avatar ? (
              <img className="usuggest__avatar" src={user.avatar} alt={user.username} />
            ) : (
              <span className="usuggest__avatar">
                {(user.firstName[0] ?? '') + (user.lastName[0] ?? '')}
              </span>
            )}
            <span className="usuggest__text">
              <span className="usuggest__name">
                {user.firstName} {user.lastName}
              </span>
              {user.username && <span className="usuggest__handle">@{user.username}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>,
    document.body,
  );
}
