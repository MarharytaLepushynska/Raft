import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { getUser } from '@/api/user';
import type { User } from '@/types/user';
import './Topbar.css';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    getUser().then((u) => {
      if (active) setUser(u);
    });
    return () => {
      active = false;
    };
  }, []);

  const initials = user ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '') : '';

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Icon name="menu" size={22} />
      </button>

      <div className="search">
        <Icon name="search" size={18} className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Search tasks, notes, spaces…"
        />
      </div>

      <div className="actions">
        <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/inbox')}>
          <Icon name="bell" />
          <span className="dot" />
        </button>

        <button type="button" className="user" onClick={() => navigate('/profile')}>
          <span className="avatar">{initials}</span>
          <span className="username">{user?.firstName}</span>
          <Icon name="chevron-down" size={16} />
        </button>
      </div>
    </header>
  );
}
