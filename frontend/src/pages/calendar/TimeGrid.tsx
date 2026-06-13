import { useEffect, useRef, useState } from 'react';
import { toISODate } from '@/lib/calendar';
import { colorHex, colorTint } from '@/lib/workspaceColors';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import {
  AXIS_WIDTH,
  HOURS,
  HOUR_HEIGHT,
  MORE_WIDTH,
  TIME_MIN_WIDTH,
  WEEKDAYS,
  blockHeight,
  columnBox,
  eventTimeRange,
  layoutDay,
  minutesToPx,
} from './calendarLayout';

function weekdayName(date: Date): string {
  return WEEKDAYS[(date.getDay() + 6) % 7];
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

export function TimeGrid({
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
                      style={{ top, height: blockHeight(item.startMin, item.endMin), width: MORE_WIDTH }}
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
