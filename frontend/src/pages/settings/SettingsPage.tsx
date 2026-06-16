import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import './SettingsPage.css';

/** The Settings page: currently just the appearance (theme and accent) section. */
export function SettingsPage() {
  return (
    <div className="settings">
      <AppearanceSettings />
    </div>
  );
}
