import { Link } from 'react-router-dom';
import { toISODate } from '@/lib/calendar';
import { colorHex } from '@/lib/workspaceColors';
import type { Event } from '@/types/event';
import './UpcomingEventsWidget.css';

const MAX_EVENTS = 5;

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

interface UpcomingEventsWidgetProps {
  events: Event[];
}

/** Dashboard widget: the next upcoming events with their day and time. */
export function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
  const now = new Date();
  const todayDate = toISODate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowDate = toISODate(tomorrow);

  const upcoming = events
    .filter((event) => new Date(event.endTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const visible = upcoming.slice(0, MAX_EVENTS);
  const more = upcoming.length - visible.length;

  const dayLabel = (start: Date): string => {
    const day = toISODate(start);
    if (day === todayDate) return 'Today';
    if (day === tomorrowDate) return 'Tomorrow';
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <section className="upcoming-events">
      <header className="upcoming-events__head">
        <span className="upcoming-events__title">Upcoming events</span>
      </header>

      {visible.length > 0 ? (
        <>
          <ol className="upcoming-events__list">
            {visible.map((event) => {
              const start = new Date(event.startTime);
              const end = new Date(event.endTime);
              const sameDay = toISODate(start) === toISODate(end);
              return (
                <li key={event.id} className="upcoming-events__row">
                  <div className="upcoming-events__when">
                    <span className="upcoming-events__day">{dayLabel(start)}</span>
                    <span className="upcoming-events__time">
                      {sameDay ? (
                        <>{formatTime(start)}&ndash;{formatTime(end)}</>
                      ) : (
                        <>{formatTime(start)} &rarr;</>
                      )}
                    </span>
                  </div>
                  <div className="upcoming-events__card">
                    <p className="upcoming-events__name">{event.title}</p>
                    {event.workspaceName && (
                      <p className="upcoming-events__space">
                        <span
                          className="upcoming-events__space-dot"
                          style={{ background: colorHex(event.workspaceColor) }}
                        />
                        {event.workspaceName}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {more > 0 && <p className="upcoming-events__more">+{more} more</p>}
        </>
      ) : (
        <p className="upcoming-events__muted">No upcoming events.</p>
      )}

      <Link to="/calendar" className="upcoming-events__view-all">
        View all
      </Link>
    </section>
  );
}
