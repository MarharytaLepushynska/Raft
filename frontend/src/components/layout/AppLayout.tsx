import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [activeItem, setActiveItem] = useState('/');
  const [isMenuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleNavigate = (id: string) => {
    setActiveItem(id);
    closeMenu();
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <div className="layout">
      <Sidebar
        activeItem={activeItem}
        onNavigate={handleNavigate}
        isOpen={isMenuOpen}
        onClose={closeMenu}
      />

      {isMenuOpen && <div className="scrim" onClick={closeMenu} />}

      <Topbar onMenuClick={() => setMenuOpen(true)} />

      <main className="content">
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
