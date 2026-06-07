import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { navSections } from '@/config/navigation';
import './Sidebar.css';

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeItem, onNavigate, isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar" data-open={isOpen}>
      <div className="brand">
        <span className="brand-name">Raft</span>
        <button className="close-btn" onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>

      <nav className="nav">
        {navSections.map((section) => (
          <div key={section.title} className="section">
            <p className="section-title">{section.title}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item.path}>
                  <button
                    className="item"
                    data-active={item.path === activeItem}
                    onClick={() => onNavigate(item.path)}
                  >
                    <Icon name={item.icon} />
                    <span className="label">{item.label}</span>
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button className="logout" onClick={() => setConfirmOpen(true)}>
        <Icon name="logout" />
        <span className="label">Log out</span>
      </button>

      {confirmOpen &&
        createPortal(
          <div className="logout-confirm" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
            <div className="logout-confirm__backdrop" onClick={() => setConfirmOpen(false)} />
            <div className="logout-confirm__card">
              <h2 id="logout-confirm-title" className="logout-confirm__title">Log out?</h2>
              <p className="logout-confirm__text">Are you sure you want to log out?</p>
              <div className="logout-confirm__actions">
                <button type="button" className="logout-confirm__cancel" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="logout-confirm__confirm" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
