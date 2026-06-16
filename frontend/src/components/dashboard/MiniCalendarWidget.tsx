import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { monthGridDays, toISODate } from '@/lib/calendar';
import { Icon } from '@/lib/icons';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import './MiniCalendarWidget.css';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface MiniCalendarWidgetProps {
  tasks: Task[];
  events?: Event[];
}

/** Dashboard widget: a compact month grid that dots the days having tasks or events. */
export function MiniCalendarWidget({ tasks, events = [] }: MiniCalendarWidgetProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toISODate(now);

  const taskDates = useMemo(() => new Set(tasks.map((task) => task.dueDate)), [tasks]);
  const eventDates = useMemo(() => new Set(events.map((event) => event.startTime.slice(0, 10))), [events]);
  const days = useMemo(() => monthGridDays(year, month), [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mini-cal">
      <Link to="/calendar" className="mini-cal__head">
        <span className="mini-cal__title">{monthLabel}</span>
        <Icon name="chevron-right" size={16} className="mini-cal__chevron" />
      </Link>

      <div className="mini-cal__grid">
        {WEEKDAYS.map((weekday, index) => (
          <span key={index} className="mini-cal__weekday">
            {weekday}
          </span>
        ))}

        {days.map((date) => {
          const iso = toISODate(date);
          const inMonth = date.getMonth() === month;
          const className = `mini-cal__day${inMonth ? '' : ' mini-cal__day--muted'}${iso === today ? ' mini-cal__day--today' : ''}`;
          if (!inMonth) {
            return (
              <span key={iso} className={className}>
                {date.getDate()}
              </span>
            );
          }
          const hasItems = taskDates.has(iso) || eventDates.has(iso);
          return (
            <Link key={iso} to={`/calendar?date=${iso}`} className={className}>
              {date.getDate()}
              {hasItems && <span className="mini-cal__dot" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
