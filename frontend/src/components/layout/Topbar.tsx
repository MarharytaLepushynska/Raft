import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { titleForPath } from '@/config/navigation';
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

  const initials = user ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '') : '';

  const title =
    pathname === '/'
      ? user
        ? `${timeGreeting()}, ${user.firstName}!`
        : timeGreeting()
      : titleForPath(pathname);

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
          <span className="avatar">{initials}</span>
        </button>
      </div>
    </header>
  );
}
