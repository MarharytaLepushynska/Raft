import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './AppLayout.css';

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleNavigate = (path: string) => {
    navigate(path);
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
        activeItem={pathname}
        onNavigate={handleNavigate}
        isOpen={isMenuOpen}
        onClose={closeMenu}
      />

      {isMenuOpen && <div className="scrim" onClick={closeMenu} />}

      <Topbar onMenuClick={() => setMenuOpen(true)} />

      <main className="content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
