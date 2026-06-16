import { useLocation } from 'react-router-dom';
import { titleForPath } from '@/config/navigation';
import './PlaceholderPage.css';

/** Stand-in page for routes that aren't built yet: shows the nav title and a "coming soon" note. */
export function PlaceholderPage() {
  const { pathname } = useLocation();

  return (
    <div className="placeholder">
      <h1 className="placeholder__title">{titleForPath(pathname)}</h1>
      <p className="placeholder__note">Coming soon.</p>
    </div>
  );
}
