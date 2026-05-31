import { Icon } from '@/lib/icons';
import { mockUser } from '@/mocks/user';
import './Topbar.css';

interface TopbarProps {
  onMenuClick: () => void;
}

const initials = (mockUser.firstName[0] ?? '') + (mockUser.lastName[0] ?? '');

export function Topbar({ onMenuClick }: TopbarProps) {
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
        <button className="icon-btn" aria-label="Notifications">
          <Icon name="bell" />
          <span className="dot" />
        </button>

        <div className="user">
          <span className="avatar">{initials}</span>
          <span className="username">{mockUser.firstName}</span>
          <Icon name="chevron-down" size={16} />
        </div>
      </div>
    </header>
  );
}
