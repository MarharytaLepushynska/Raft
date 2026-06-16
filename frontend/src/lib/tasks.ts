import type { Task, TaskPriority, TaskStatus, TaskState } from '@/types/task';
import type { Workspace } from '@/types/workspace';

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/** Local date-time (`YYYY-MM-DDTHH:mm`) a task is anchored to, defaulting to 09:00 when it has no time. */
export function taskAnchorISO(task: Task): string {
  return `${task.dueDate}T${task.dueTime ?? '09:00'}`;
}

export const priorityColors: Record<TaskPriority, string> = {
  HIGH: 'var(--color-priority-high)',
  MEDIUM: 'var(--color-priority-medium)',
  LOW: 'var(--color-priority-low)',
};

export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export const priorityOptions = PRIORITIES.map((p) => ({id: p, label: priorityLabels[p], color: priorityColors[p],}));

/** Default assignee for a new task: the current user in shared spaces, nobody in personal ones. */
export function defaultAssigneeId(
  workspaceId: string | undefined,
  workspaces: Workspace[],
  userId: string | undefined,
): string | undefined {
  const space = workspaces.find((w) => w.id === workspaceId);
  return space?.type === 'SHARED' ? userId : undefined;
}

/** Formats a task's due date for display (`Jun 16` or `Jun 16 · 14:30`). */
export function formatTaskDue(task: Task): string {
  const date = new Date(`${task.dueDate}T${task.dueTime ?? '00:00'}`);
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return task.dueTime ? `${day} · ${task.dueTime}` : day;
}

/** Whether a task is "mine": any personal-space task, or a shared task assigned to me. */
export function isMyTask(task: Task, userId: string | undefined): boolean {
  if (task.workspaceType === 'PERSONAL') return true;
  return task.assignee?.id === userId;
}

export const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
};

/** Status the task moves to when its status chip is clicked (cycles TODO → IN_PROGRESS → COMPLETED → TODO). */
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

/** The moment a task is due, defaulting to end of day (23:59) when it has no time. */
export function taskDueAt(task: Task): Date {
  return new Date(`${task.dueDate}T${task.dueTime ?? '23:59'}`);
}

/** Derives a task's state: `done`, `overdue` (past due and unfinished), or `upcoming`. */
export function getTaskState(task: Task, now: Date = new Date()): TaskState {
  if (task.status === 'COMPLETED') return 'done';
  if (taskDueAt(task).getTime() < now.getTime()) return 'overdue';
  return 'upcoming';
}

export function isDueOn(task: Task, isoDate: string): boolean {
  return task.dueDate === isoDate;
}

/** Comparator: sorts by due time, putting timed tasks before all-day ones. */
export function byDueTime(a: Task, b: Task): number {
  if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
  if (a.dueTime) return -1;
  if (b.dueTime) return 1;
  return 0;
}

export function byDeadline(a: Task, b: Task): number {
  return taskDueAt(a).getTime() - taskDueAt(b).getTime();
}

export interface TaskGroup {
  key: string;
  title: string;
  overdue: boolean;
  tasks: Task[];
}

/** Splits tasks into Overdue / Today / Upcoming sections, each sorted by `sortFn`. */
export function groupByDateState(tasks: Task[], now: Date, sortFn: (a: Task, b: Task) => number): TaskGroup[] {
  const today = todayISO(now);
  const withState = tasks.map((task) => ({ task, state: getTaskState(task, now) }));
  const pick = (fn: (x: { task: Task; state: TaskState }) => boolean) =>
    withState.filter(fn).map((x) => x.task).sort(sortFn);
  return [
    { key: 'overdue', title: 'Overdue', overdue: true, tasks: pick((x) => x.state === 'overdue') },
    { key: 'today', title: 'Today', overdue: false, tasks: pick((x) => x.state === 'upcoming' && isDueOn(x.task, today)) },
    { key: 'upcoming', title: 'Upcoming', overdue: false, tasks: pick((x) => x.state === 'upcoming' && !isDueOn(x.task, today)) },
  ];
}

export type TaskStatusFilter = 'all' | 'active' | 'completed';
export type TaskSort = 'deadline' | 'priority';

export function taskSorter(sort: TaskSort): (a: Task, b: Task) => number {
  return sort === 'priority' ? byPriority : byDeadline;
}

/** Builds the full list of board sections (active groups + optional Completed) for the given status filter. */
export function buildTaskSections(active: Task[], completed: Task[], now: Date, sortFn: (a: Task, b: Task) => number, statusFilter: TaskStatusFilter,
): TaskGroup[] {
  return [
    ...(statusFilter !== 'completed' ? groupByDateState(active, now, sortFn) : []),
    ...(statusFilter !== 'active' && completed.length > 0
      ? [{ key: 'completed', title: 'Completed', overdue: false, tasks: [...completed].sort(sortFn) }]
      : []),
  ].filter((section) => section.tasks.length > 0);
}
