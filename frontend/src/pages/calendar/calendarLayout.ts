import { toISODate } from '@/lib/calendar';
import { addDays } from '@/lib/tasks';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 44;
export const AXIS_WIDTH = 64;
export const MORE_WIDTH = 16;
export const TIME_MIN_WIDTH = 72;

const DAY_MINUTES = 24 * 60;
const TASK_DURATION_MIN = 30;
const EVENT_MIN_HEIGHT = 18;
const TASK_STACK_STEP = 22;
const COL_INSET = 2;
const COL_GAP = 4;

function clockMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

function minutesOfDay(dateTime: string): number {
  return clockMinutes(dateTime.slice(11, 16));
}

export function eventTimeRange(event: Event): string {
  return `${event.startTime.slice(11, 16)}–${event.endTime.slice(11, 16)}`;
}

export function coveredDays(event: Event): string[] {
  const startISO = event.startTime.slice(0, 10);
  let endISO = event.endTime.slice(0, 10);
  if (endISO !== startISO && event.endTime.slice(11, 16) === '00:00') {
    endISO = toISODate(addDays(new Date(`${endISO}T00:00`), -1));
  }
  const days: string[] = [];
  let cursor = new Date(`${startISO}T00:00`);
  const last = new Date(`${endISO}T00:00`);
  while (cursor <= last) {
    days.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

function daySegment(event: Event, iso: string): { startMin: number; endMin: number } {
  const startISO = event.startTime.slice(0, 10);
  const endISO = event.endTime.slice(0, 10);
  return {
    startMin: iso === startISO ? minutesOfDay(event.startTime) : 0,
    endMin: iso === endISO ? minutesOfDay(event.endTime) : DAY_MINUTES,
  };
}

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

export function blockHeight(startMin: number, endMin: number): number {
  return Math.max(minutesToPx(endMin - startMin), EVENT_MIN_HEIGHT);
}

export function columnBox(col: number, cols: number, reserve: boolean, colWidth = 0) {
  const reserved = reserve ? MORE_WIDTH + COL_GAP : 0;
  const span = `(100% - ${reserved}px)`;
  return {
    left: `calc(${span} * ${col / cols} + ${COL_INSET}px)`,
    width: `calc(${span} * ${1 / cols} - ${COL_GAP}px)`,
    widthPx: (colWidth - reserved) / cols - COL_GAP,
  };
}

type LaneItem =
  | { key: string; kind: 'event'; event: Event; startMin: number; endMin: number; lane: number }
  | { key: string; kind: 'tasks'; tasks: Task[]; startMin: number; endMin: number; lane: number };

export type Block =
  | { key: string; kind: 'event'; event: Event; startMin: number; endMin: number; col: number; cols: number; reserve: boolean }
  | { key: string; kind: 'tasks'; tasks: Task[]; startMin: number; endMin: number; col: number; cols: number; reserve: boolean }
  | { key: string; kind: 'more'; count: number; startMin: number; endMin: number };

export function layoutDay(iso: string, events: Event[], tasks: Task[], maxCols: number): Block[] {
  const items: LaneItem[] = [];
  for (const event of events) {
    const { startMin, endMin } = daySegment(event, iso);
    items.push({ key: `e${event.id}`, kind: 'event', event, startMin, endMin, lane: 0 });
  }
  const taskGroups = new Map<number, Task[]>();
  for (const task of tasks) {
    if (!task.dueTime) continue;
    const minute = clockMinutes(task.dueTime);
    const group = taskGroups.get(minute) ?? [];
    group.push(task);
    taskGroups.set(minute, group);
  }
  for (const [startMin, group] of taskGroups) {
    const stackMin = ((group.length * TASK_STACK_STEP) / HOUR_HEIGHT) * 60;
    const endMin = Math.min(startMin + Math.max(TASK_DURATION_MIN, stackMin), DAY_MINUTES);
    items.push({ key: `t${startMin}`, kind: 'tasks', tasks: group, startMin, endMin, lane: 0 });
  }
  const rank = (it: LaneItem) => (it.kind === 'tasks' ? 0 : 1);
  items.sort((a, b) => a.startMin - b.startMin || rank(a) - rank(b) || a.endMin - b.endMin);

  const blocks: Block[] = [];
  let cluster: LaneItem[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.endMin);
      } else {
        laneEnds[lane] = item.endMin;
      }
      item.lane = lane;
    }
    const laneCount = laneEnds.length;
    const overflow = laneCount > maxCols;
    const cols = overflow ? maxCols - 1 : laneCount;
    let hidden = 0;
    let hiddenStart = DAY_MINUTES;
    let hiddenEnd = 0;
    for (const item of cluster) {
      if (overflow && item.lane >= maxCols - 1) {
        hidden += 1;
        hiddenStart = Math.min(hiddenStart, item.startMin);
        hiddenEnd = Math.max(hiddenEnd, item.endMin);
        continue;
      }
      const placed = { startMin: item.startMin, endMin: item.endMin, col: item.lane, cols, reserve: overflow };
      if (item.kind === 'event') {
        blocks.push({ key: item.key, kind: 'event', event: item.event, ...placed });
      } else {
        blocks.push({ key: item.key, kind: 'tasks', tasks: item.tasks, ...placed });
      }
    }
    if (hidden > 0) {
      blocks.push({ key: `m${cluster[0].key}`, kind: 'more', count: hidden, startMin: hiddenStart, endMin: hiddenEnd });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of items) {
    if (cluster.length && item.startMin >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();
  return blocks;
}
