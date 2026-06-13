import { useEffect, useMemo, useRef, useState } from 'react';
import { TaskModal } from '@/components/task/TaskModal';
import { EventModal } from '@/components/event/EventModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { monthGridDays, toISODate, weekDays } from '@/lib/calendar';
import { Icon } from '@/lib/icons';
import { addDays, byDueTime, defaultAssigneeId, isMyTask, priorityOptions } from '@/lib/tasks';
import { useTasks } from '@/hooks/tasks/useTasks';
import { useEvents } from '@/hooks/events/useEvents';
import { useWorkspaces } from '@/hooks/workspaces/useWorkspaces';
import { capitalize } from '@/lib/utils';
import { colorHex, colorTint } from '@/lib/workspaceColors';
import { useAuth } from '@/auth/AuthContext';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import './CalendarPage.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_PER_DAY = 3;
const MAX_EVENTS_PER_DAY = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 44;
const DAY_MINUTES = 24 * 60;
const TASK_DURATION_MIN = 30;
const EVENT_MIN_HEIGHT = 18;
const TASK_STACK_STEP = 22;
const MORE_WIDTH = 16;
const AXIS_WIDTH = 64;
const TIME_MIN_WIDTH = 72;
const COL_INSET = 2;
const COL_GAP = 4;

type View = 'month' | 'week' | 'day';

function weekdayName(date: Date): string {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function clockMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

function minutesOfDay(dateTime: string): number {
  return clockMinutes(dateTime.slice(11, 16));
}

function eventTimeRange(event: Event): string {
  return `${event.startTime.slice(11, 16)}–${event.endTime.slice(11, 16)}`;
}

function coveredDays(event: Event): string[] {
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

function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

function blockHeight(startMin: number, endMin: number): number {
  return Math.max(minutesToPx(endMin - startMin), EVENT_MIN_HEIGHT);
}

function columnBox(col: number, cols: number, reserve: boolean, colWidth: number) {
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

type Block =
  | { key: string; kind: 'event'; event: Event; startMin: number; endMin: number; col: number; cols: number; reserve: boolean }
  | { key: string; kind: 'tasks'; tasks: Task[]; startMin: number; endMin: number; col: number; cols: number; reserve: boolean }
  | { key: string; kind: 'more'; count: number; startMin: number; endMin: number };

function layoutDay(iso: string, events: Event[], tasks: Task[], maxCols: number): Block[] {
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

function Chip({ task, showTime = true, onSelect }: { task: Task; showTime?: boolean; onSelect: (task: Task) => void }) {
  return (
    <button
      type="button"
      className={`tg__chip${task.status === 'COMPLETED' ? ' tg__chip--done' : ''}`}
      style={{ borderLeftColor: colorHex(task.workspaceColor) }}
      onClick={() => onSelect(task)}
    >
      {showTime && task.dueTime && <span className="tg__chip-time">{task.dueTime}</span>}
      <span className="tg__chip-title">{task.title}</span>
    </button>
  );
}

function TimeGrid({
  days,
  tasksByDate,
  eventsByDay,
  today,
  maxCols,
  onPickDay,
  onSelectTask,
  onSelectEvent,
}: {
  days: Date[];
  tasksByDate: Map<string, Task[]>;
  eventsByDay: Map<string, Event[]>;
  today: string;
  maxCols: number;
  onPickDay: (date: Date) => void;
  onSelectTask: (task: Task) => void;
  onSelectEvent: (event: Event) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setColWidth((el.clientWidth - AXIS_WIDTH) / days.length);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [days.length]);

  const cols = `${AXIS_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`;
  return (
    <div className="tg">
      <div className="tg__head" style={{ gridTemplateColumns: cols }}>
        <div className="tg__corner" />
        {days.map((date) => {
          const iso = toISODate(date);
          return (
            <button
              key={iso}
              type="button"
              className={`tg__day-head${iso === today ? ' tg__day-head--today' : ''}`}
              onClick={() => onPickDay(date)}
            >
              <span className="tg__day-name">{weekdayName(date)}</span>
              <span className="tg__day-num">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="tg__allday" style={{ gridTemplateColumns: cols }}>
        <div className="tg__axis-label">all-day</div>
        {days.map((date) => {
          const iso = toISODate(date);
          const allDay = (tasksByDate.get(iso) ?? []).filter((task) => !task.dueTime);
          return (
            <div key={iso} className="tg__cell">
              {allDay.map((task) => (
                <Chip key={task.id} task={task} onSelect={onSelectTask} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="tg__body" ref={bodyRef} style={{ gridTemplateColumns: cols, height: HOURS.length * HOUR_HEIGHT }}>
        <div className="tg__axis-col">
          {HOURS.map((hour) => (
            <div key={hour} className="tg__axis" style={{ height: HOUR_HEIGHT }}>
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((date) => {
          const iso = toISODate(date);
          const dayEvents = eventsByDay.get(iso) ?? [];
          const timedTasks = (tasksByDate.get(iso) ?? []).filter((task) => task.dueTime);
          const blocks = layoutDay(iso, dayEvents, timedTasks, maxCols);
          return (
            <div key={iso} className="tg__col">
              {blocks.map((item) => {
                const top = minutesToPx(item.startMin);
                if (item.kind === 'more') {
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className="tg__more-block"
                      style={{ top, height: blockHeight(item.startMin, item.endMin), right: 2, width: MORE_WIDTH }}
                      onClick={() => onPickDay(date)}
                      title={`+${item.count} more`}
                    >
                      +{item.count}
                    </button>
                  );
                }
                const { left, width, widthPx } = columnBox(item.col, item.cols, item.reserve, colWidth);
                const showTime = colWidth === 0 || widthPx >= TIME_MIN_WIDTH;
                if (item.kind === 'tasks') {
                  return (
                    <div key={item.key} className="tg__task-stack" style={{ top, left, width }}>
                      {item.tasks.map((task) => (
                        <Chip key={task.id} task={task} showTime={showTime} onSelect={onSelectTask} />
                      ))}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    className="tg__event"
                    style={{
                      top,
                      height: blockHeight(item.startMin, item.endMin),
                      left,
                      width,
                      background: colorTint(item.event.workspaceColor, 22),
                      borderLeftColor: colorHex(item.event.workspaceColor),
                    }}
                    onClick={() => onSelectEvent(item.event)}
                    title={`${eventTimeRange(item.event)} ${item.event.title}`}
                  >
                    {showTime && <span className="tg__event-time">{eventTimeRange(item.event)}</span>}
                    <span className="tg__event-title">{item.event.title}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { user } = useAuth();
  const { tasks, create, update, remove } = useTasks();
  const { events, create: createEvent, update: updateEvent, remove: removeEvent } = useEvents();
  const { workspaces, spaceOptions } = useWorkspaces();
  const [view, setView] = useState<View>('month');
  const [focus, setFocus] = useState(() => new Date());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(() => new Set());
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(() => new Set());
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [modalEvent, setModalEvent] = useState<Event | null | undefined>(undefined);

  const handleCreate = (input: Omit<Task, 'id'>) =>
    create({ ...input, assigneeId: defaultAssigneeId(input.workspaceId, workspaces, user?.id) }).then(() =>
      setModalTask(undefined),
    );
  const handleUpdate = (id: string, patch: Partial<Task>) => update(id, patch).then(() => setModalTask(undefined));
  const handleDelete = (id: string) => remove(id).then(() => setModalTask(undefined));

  const handleEventCreate = (input: Omit<Event, 'id'>) =>
    createEvent(input).then(() => setModalEvent(undefined));
  const handleEventUpdate = (id: string, patch: Partial<Event>) =>
    updateEvent(id, patch).then(() => setModalEvent(undefined));
  const handleEventDelete = (id: string) => removeEvent(id).then(() => setModalEvent(undefined));

  const today = toISODate(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!isMyTask(task, user?.id)) continue;
      if (selectedPriorities.size > 0 && !selectedPriorities.has(task.priority)) continue;
      if (selectedSpaces.size > 0 && (!task.workspaceId || !selectedSpaces.has(task.workspaceId))) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    for (const list of map.values()) list.sort(byDueTime);
    return map;
  }, [tasks, selectedPriorities, selectedSpaces, user?.id]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      if (selectedSpaces.size > 0 && (!event.workspaceId || !selectedSpaces.has(event.workspaceId))) continue;
      for (const iso of coveredDays(event)) {
        const list = map.get(iso) ?? [];
        list.push(event);
        map.set(iso, list);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [events, selectedSpaces]);

  const shift = (delta: number) =>
    setFocus((f) => {
      if (view === 'month') return new Date(f.getFullYear(), f.getMonth() + delta, f.getDate());
      if (view === 'week') return addDays(f, 7 * delta);
      return addDays(f, delta);
    });

  const title =
    view === 'month'
      ? focus.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'day'
        ? formatDay(focus)
        : (() => {
            const days = weekDays(focus);
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${fmt(days[0])} – ${fmt(days[6])}`;
          })();

  const monthDays = monthGridDays(focus.getFullYear(), focus.getMonth());

  return (
    <div className="calendar">
      <header className="calendar__head">
        <h2 className="calendar__title">{title}</h2>
        <div className="calendar__controls">
          <div className="calendar__views">
            {(['month', 'week', 'day'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="calendar__view-btn"
                data-active={view === value}
                onClick={() => setView(value)}
              >
                {capitalize(value)}
              </button>
            ))}
          </div>
          <div className="calendar__nav">
            <button className="calendar__btn" onClick={() => shift(-1)} aria-label="Previous">
              <Icon name="chevron-left" size={18} />
            </button>
            <button className="calendar__today" onClick={() => setFocus(new Date())}>
              Today
            </button>
            <button className="calendar__btn" onClick={() => shift(1)} aria-label="Next">
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <button type="button" className="calendar__add" onClick={() => setModalTask(null)}>
            <Icon name="plus" size={16} />
            Task
          </button>
          <button type="button" className="calendar__add" onClick={() => setModalEvent(null)}>
            <Icon name="plus" size={16} />
            Event
          </button>
        </div>
      </header>

      <div className="calendar__filters">
        <MultiSelectFilter
          options={priorityOptions}
          selected={selectedPriorities}
          onChange={setSelectedPriorities}
          allLabel="All priorities"
          countNoun="priorities"
        />
        {workspaces.length > 0 && (
          <MultiSelectFilter
            options={spaceOptions}
            selected={selectedSpaces}
            onChange={setSelectedSpaces}
            allLabel="All spaces"
            countNoun="spaces"
            icon="spaces"
          />
        )}
      </div>

      <div className="calendar__scroll">
      {view === 'month' ? (
        <div className="calendar__grid">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="calendar__weekday">
              {weekday}
            </div>
          ))}

          {monthDays.map((date) => {
            const iso = toISODate(date);
            const inMonth = date.getMonth() === focus.getMonth();
            const dayTasks = tasksByDate.get(iso) ?? [];
            const dayEvents = eventsByDay.get(iso) ?? [];
            const extraEvents = dayEvents.length - MAX_EVENTS_PER_DAY;
            const extra = dayTasks.length - MAX_PER_DAY;
            const classes = [
              'calendar__cell',
              inMonth ? '' : 'calendar__cell--muted',
              iso === today ? 'calendar__cell--today' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={iso}
                type="button"
                className={classes}
                onClick={() => {
                  setFocus(date);
                  setView('day');
                }}
              >
                <span className="calendar__date">{date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <div className="calendar__events">
                    {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => (
                      <span
                        key={event.id}
                        className="calendar__event"
                        style={{
                          background: colorTint(event.workspaceColor, 16),
                          borderLeftColor: colorHex(event.workspaceColor),
                        }}
                      >
                        {event.title}
                      </span>
                    ))}
                    {extraEvents > 0 && <span className="calendar__more">+{extraEvents} more</span>}
                  </div>
                )}
                <div className="calendar__tasks">
                  {dayTasks.slice(0, MAX_PER_DAY).map((task) => (
                    <span
                      key={task.id}
                      className={`calendar__task${task.status === 'COMPLETED' ? ' calendar__task--done' : ''}`}
                    >
                      <span className="calendar__dot" style={{ background: colorHex(task.workspaceColor) }} />
                      <span className="calendar__task-title">{task.title}</span>
                    </span>
                  ))}
                  {extra > 0 && <span className="calendar__more">+{extra} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <TimeGrid
          days={view === 'week' ? weekDays(focus) : [focus]}
          tasksByDate={tasksByDate}
          eventsByDay={eventsByDay}
          today={today}
          maxCols={view === 'week' ? 3 : Infinity}
          onPickDay={(date) => {
            setFocus(date);
            setView('day');
          }}
          onSelectTask={setModalTask}
          onSelectEvent={setModalEvent}
        />
      )}
      </div>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          defaultDate={toISODate(focus)}
          onClose={() => setModalTask(undefined)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          defaultDate={toISODate(focus)}
          onClose={() => setModalEvent(undefined)}
          onCreate={handleEventCreate}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
        />
      )}
    </div>
  );
}
