import {
  LayoutDashboard, FolderKanban, NotebookPen, ListChecks, Calendar, BarChart3, Boxes, MessagesSquare,
  Wallet, Inbox, Settings, HelpCircle, LogOut, Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Check, Folder, FolderPlus, FilePlus, Pencil, Pin, PinOff, type LucideIcon,
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
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  menu: Menu,
  close: X,
  check: Check,
  folder: Folder,
  'folder-plus': FolderPlus,
  'file-plus': FilePlus,
  edit: Pencil,
  pin: Pin,
  unpin: PinOff,
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
