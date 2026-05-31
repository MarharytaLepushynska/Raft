import type { NavSection } from '@/types/navigation';

export const navSections: NavSection[] = [
  {
    title: 'Study',
    items: [
      { label: 'Dashboard', icon: 'dashboard', path: '/' },
      { label: 'Projects', icon: 'projects', path: '/projects' },
      { label: 'Notes', icon: 'notes', path: '/notes' },
      { label: 'To-Do', icon: 'todo', path: '/todo' },
      { label: 'Calendar', icon: 'calendar', path: '/calendar' },
      { label: 'Statistics', icon: 'statistics', path: '/statistics' },
    ],
  },
  {
    title: 'Expenses',
    items: [
      { label: 'Spaces', icon: 'spaces', path: '/spaces' },
      { label: 'Chats', icon: 'chats', path: '/chats' },
      { label: 'Statistics', icon: 'expenses', path: '/expenses' },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Inbox', icon: 'inbox', path: '/inbox', badge: 3 },
      { label: 'Settings', icon: 'settings', path: '/settings' },
      { label: 'Help', icon: 'help', path: '/help' },
    ],
  },
];
