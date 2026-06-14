import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { getWorkspace } from '@/api/workspaces';
import { colorHex } from '@/lib/workspaceColors';
import { titleForPath } from '@/config/navigation';
import type { WorkspaceColor } from '@/types/workspace';
import './Topbar.css';

interface TopbarProps {
  onMenuClick: () => void;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const spaceId = pathname.match(/^\/spaces\/(.+)$/)?.[1] ?? null;
  const [space, setSpace] = useState<{ name: string; color: WorkspaceColor | null } | null>(null);

  useEffect(() => {
    if (!spaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpace(null);
      return;
    }
    let active = true;
    getWorkspace(spaceId)
      .then((w) => {
        if (active) setSpace({ name: w.name, color: w.color });
      })
      .catch(() => {
        if (active) setSpace(null);
      });
    return () => {
      active = false;
    };
  }, [spaceId, pathname]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const { id, name, color } = (event as CustomEvent<{ id: string; name: string; color: WorkspaceColor | null }>).detail;
      if (id === spaceId) {
        setSpace((prev) => (prev ? { ...prev, name, color } : prev));
      }
    };
    window.addEventListener('workspace-updated', onUpdated);
    return () => window.removeEventListener('workspace-updated', onUpdated);
  }, [spaceId]);

  const initials = user ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '') : '';

  let title: ReactNode;
  if (spaceId) {
    title = space ? (
      <span className="topbar__space">
        <span className="topbar__space-dot" style={{ background: colorHex(space.color) }} />
        <span className="topbar__space-name">{space.name}</span>
        <button
          type="button"
          className="topbar__space-menu"
          aria-label="Space details"
          title="Space details"
          onClick={() => navigate(`/spaces/${spaceId}?edit=1`)}
        >
          <Icon name="more" size={18} />
        </button>
      </span>
    ) : (
      'Space'
    );
  } else if (pathname === '/') {
    title = user ? `${timeGreeting()}, ${user.firstName}!` : timeGreeting();
  } else {
    title = titleForPath(pathname);
  }

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Icon name="menu" size={22} />
      </button>

      <h1 className="topbar__title">{title}</h1>

      <div className="actions">
        <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/inbox')}>
          <Icon name="bell" />
          <span className="dot" />
        </button>

        <button type="button" className="user" onClick={() => navigate('/profile')}>
          {user?.avatar ? (
            <img className="avatar" src={user.avatar} alt={user.username} />
          ) : (
            <span className="avatar">{initials}</span>
          )}
        </button>
      </div>
    </header>
  );
}
