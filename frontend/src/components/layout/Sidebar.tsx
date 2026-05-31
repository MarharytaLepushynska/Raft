import { Icon } from '@/lib/icons';
import { navSections } from '@/config/navigation';
import './Sidebar.css';

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeItem, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <aside className="sidebar" data-open={isOpen}>
      <div className="brand">
        <span className="brand-mark">🦦</span>
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

      <button className="logout">
        <Icon name="logout" />
        <span className="label">Log out</span>
      </button>
    </aside>
  );
}
