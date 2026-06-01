import { useEffect, useMemo, useState } from 'react';
import { getTasks } from '@/api/tasks';
import { monthGridDays, toISODate, weekDays } from '@/lib/calendar';
import { Icon } from '@/lib/icons';
import { addDays, byDueTime, priorityLabels } from '@/lib/tasks';
import type { Task, TaskPriority } from '@/types/task';
import './CalendarPage.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
const MAX_PER_DAY = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type View = 'month' | 'week' | 'day';

function weekdayName(date: Date): string {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function Chip({ task }: { task: Task }) {
  return (
    <span
      className={`tg__chip tg__chip--${task.priority.toLowerCase()}${task.status === 'COMPLETED' ? ' tg__chip--done' : ''}`}
    >
      {task.dueTime && <span className="tg__chip-time">{task.dueTime}</span>}
      <span className="tg__chip-title">{task.title}</span>
    </span>
  );
}

function TimeGrid({
  days,
  tasksByDate,
  today,
  onPickDay,
}: {
  days: Date[];
  tasksByDate: Map<string, Task[]>;
  today: string;
  onPickDay: (date: Date) => void;
}) {
  const cols = `64px repeat(${days.length}, minmax(0, 1fr))`;
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
                <Chip key={task.id} task={task} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="tg__body">
        {HOURS.map((hour) => (
          <div key={hour} className="tg__row" style={{ gridTemplateColumns: cols }}>
            <div className="tg__axis">{String(hour).padStart(2, '0')}:00</div>
            {days.map((date) => {
              const iso = toISODate(date);
              const atHour = (tasksByDate.get(iso) ?? []).filter(
                (task) => task.dueTime && Number(task.dueTime.slice(0, 2)) === hour,
              );
              return (
                <div key={iso} className="tg__cell">
                  {atHour.map((task) => (
                    <Chip key={task.id} task={task} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>('month');
  const [focus, setFocus] = useState(() => new Date());
  const [activePriorities, setActivePriorities] = useState<Set<TaskPriority>>(
    () => new Set(PRIORITIES),
  );

  const togglePriority = (priority: TaskPriority) =>
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });

  useEffect(() => {
    let active = true;
    getTasks().then((all) => {
      if (active) setTasks(all);
    });
    return () => {
      active = false;
    };
  }, []);

  const today = toISODate(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!activePriorities.has(task.priority)) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    for (const list of map.values()) list.sort(byDueTime);
    return map;
  }, [tasks, activePriorities]);

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
                {value[0].toUpperCase() + value.slice(1)}
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
        </div>
      </header>

      <div className="calendar__filters">
        {PRIORITIES.map((priority) => (
          <button
            key={priority}
            type="button"
            className="calendar__filter"
            data-active={activePriorities.has(priority)}
            onClick={() => togglePriority(priority)}
          >
            <span className={`calendar__filter-dot calendar__filter-dot--${priority.toLowerCase()}`} />
            {priorityLabels[priority]}
          </button>
        ))}
      </div>

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
                <div className="calendar__tasks">
                  {dayTasks.slice(0, MAX_PER_DAY).map((task) => (
                    <span
                      key={task.id}
                      className={`calendar__task${task.status === 'COMPLETED' ? ' calendar__task--done' : ''}`}
                    >
                      <span className={`calendar__dot calendar__dot--${task.priority.toLowerCase()}`} />
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
          today={today}
          onPickDay={(date) => {
            setFocus(date);
            setView('day');
          }}
        />
      )}
    </div>
  );
}
