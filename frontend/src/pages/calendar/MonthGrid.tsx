import { toISODate } from '@/lib/calendar';
import { colorHex, colorTint } from '@/lib/workspaceColors';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import { WEEKDAYS } from './calendarLayout';

const MAX_PER_DAY = 3;
const MAX_EVENTS_PER_DAY = 3;

export function MonthGrid({
  days,
  month,
  tasksByDate,
  eventsByDay,
  today,
  onPickDay,
}: {
  days: Date[];
  month: number;
  tasksByDate: Map<string, Task[]>;
  eventsByDay: Map<string, Event[]>;
  today: string;
  onPickDay: (date: Date) => void;
}) {
  return (
    <div className="calendar__grid">
      {WEEKDAYS.map((weekday) => (
        <div key={weekday} className="calendar__weekday">
          {weekday}
        </div>
      ))}

      {days.map((date) => {
        const iso = toISODate(date);
        const inMonth = date.getMonth() === month;
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
          <button key={iso} type="button" className={classes} onClick={() => onPickDay(date)}>
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
  );
}
