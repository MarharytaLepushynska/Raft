import {
  LayoutDashboard, FolderKanban, NotebookPen, ListChecks, Calendar, BarChart3, Boxes, MessagesSquare,
  Wallet, Inbox, Settings, HelpCircle, LogOut, Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Check, Folder, FolderPlus, FilePlus, Pencil, Pin, PinOff, MoreHorizontal, Trash2, MailCheck,
  Award, Sun, Moon, Monitor, Send, CircleStar, CircleUserRound, BellRing, type LucideIcon,
} from 'lucide-react';

/** Maps a name to its lucide icon, so components use `<Icon name="..." />` instead of importing lucide. */
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
  'bell-ring': BellRing,
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
  more: MoreHorizontal,
  trash: Trash2,
  read: MailCheck,
  achievement: Award,
  sun: Sun,
  moon: Moon,
  system: Monitor,
  send: Send,
  'circle-star': CircleStar,
  profile: CircleUserRound,
} satisfies Record<string, LucideIcon>;

/** Names of every icon the Icon component can render. */
export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Renders a named icon from the central icon set, with the app's default stroke width. */
export function Icon({ name, size = 20, className }: IconProps) {
  const Glyph = icons[name];
  return <Glyph size={size} strokeWidth={1.8} className={className} />;
}
