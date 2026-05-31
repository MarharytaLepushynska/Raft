import {
  LayoutDashboard, FolderKanban, NotebookPen, ListChecks, Calendar, BarChart3, Boxes, MessagesSquare,
  Wallet, Inbox, Settings, HelpCircle, LogOut, Search, Bell, Plus, ChevronDown, Menu, X, type LucideIcon,
} from 'lucide-react';

const icons = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  notes: NotebookPen,
  todo: ListChecks,
  calendar: Calendar,
  statistics: BarChart3,
  spaces: Boxes,
  chats: MessagesSquare,
  expenses: Wallet,
  inbox: Inbox,
  settings: Settings,
  help: HelpCircle,
  logout: LogOut,
  search: Search,
  bell: Bell,
  plus: Plus,
  'chevron-down': ChevronDown,
  menu: Menu,
  close: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  const Glyph = icons[name];
  return <Glyph size={size} strokeWidth={1.8} className={className} />;
}
