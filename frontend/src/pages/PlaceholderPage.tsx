import { useLocation } from 'react-router-dom';
import { navSections } from '@/config/navigation';
import './PlaceholderPage.css';

function labelForPath(path: string): string {
  for (const section of navSections) {
    const item = section.items.find((navItem) => navItem.path === path);
    if (item) return item.label;
  }
  const slug = path.replace('/', '');
  return slug ? slug[0].toUpperCase() + slug.slice(1) : 'Page';
}

export function PlaceholderPage() {
  const { pathname } = useLocation();

  return (
    <div className="placeholder">
      <h1 className="placeholder__title">{labelForPath(pathname)}</h1>
      <p className="placeholder__note">Coming soon.</p>
    </div>
  );
}
