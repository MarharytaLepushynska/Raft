import type { Task, TaskPriority, TaskStatus, TaskState } from '@/types/task';

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const priorityColors: Record<TaskPriority, string> = {
  HIGH: '#c73951',
  MEDIUM: '#e0566a',
  LOW: '#e5737f',
};

export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export function formatTaskDue(task: Task): string {
  const date = new Date(`${task.dueDate}T${task.dueTime ?? '00:00'}`);
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return task.dueTime ? `${day} · ${task.dueTime}` : day;
}

export function isMyTask(task: Task, userId: string | undefined): boolean {
  if (task.workspaceType === 'PERSONAL') return true;
  return task.assignee?.id === userId;
}

export const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
};

export const nextStatus: Record<TaskStatus, TaskStatus> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'TODO',
};

const priorityOrder: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function byPriority(a: Task, b: Task): number {
  return priorityOrder[a.priority] - priorityOrder[b.priority];
}

export function todayISO(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA');
}

export function addDays(now: Date, days: number): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date;
}

export function taskDueAt(task: Task): Date {
  return new Date(`${task.dueDate}T${task.dueTime ?? '23:59'}`);
}

export function getTaskState(task: Task, now: Date = new Date()): TaskState {
  if (task.status === 'COMPLETED') return 'done';
  if (taskDueAt(task).getTime() < now.getTime()) return 'overdue';
  return 'upcoming';
}

export function isDueOn(task: Task, isoDate: string): boolean {
  return task.dueDate === isoDate;
}

export function byDueTime(a: Task, b: Task): number {
  if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
  if (a.dueTime) return -1;
  if (b.dueTime) return 1;
  return 0;
}

export function byDeadline(a: Task, b: Task): number {
  return taskDueAt(a).getTime() - taskDueAt(b).getTime();
}
