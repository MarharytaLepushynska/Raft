import type { IconName } from '@/lib/icons';

export interface NavItem {
  label: string;
  icon: IconName;
  path: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
