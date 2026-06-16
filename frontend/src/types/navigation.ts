import type { IconName } from '@/lib/icons';

/** A single sidebar link: its label, icon, and route. */
export interface NavItem {
  label: string;
  icon: IconName;
  path: string;
}

/** A titled group of sidebar links (e.g. "Workspace", "General"). */
export interface NavSection {
  title: string;
  items: NavItem[];
}
