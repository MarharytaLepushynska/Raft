import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { EventModal } from '@/components/event/EventModal';
import { ReminderBell } from '@/components/reminder/ReminderBell';
import { toISODate } from '@/lib/calendar';
import { addDays } from '@/lib/tasks';
import { colorHex, colorTint } from '@/lib/workspaceColors';
import { useEvents } from '@/hooks/events/useEvents';
import { useReminders } from '@/hooks/inbox/useReminders';
import type { Event } from '@/types/event';
import type { WorkspaceColor } from '@/types/workspace';
import { HOURS, HOUR_HEIGHT, blockHeight, columnBox, coveredDays, eventTimeRange, layoutDay, minutesToPx } from '@/pages/calendar/calendarLayout';
import './WorkspaceTimeline.css';

const START_HOUR = 7;

interface WorkspaceTimelineProps {
  workspaceId: string;
  color: WorkspaceColor | null;
}

export function WorkspaceTimeline({ workspaceId, color }: WorkspaceTimelineProps) {
  const { events, create, update, remove } = useEvents({ workspaceId });
  const { reminderForEvent, setEventReminder, remove: removeReminder } = useReminders();
  const [day, setDay] = useState(() => new Date());
  const [modalEvent, setModalEvent] = useState<Event | null | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const iso = toISODate(day);
  const isToday = iso === toISODate(new Date());

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => coveredDays(event).includes(iso))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, iso],
  );

  const blocks = useMemo(() => layoutDay(iso, dayEvents, [], Infinity), [iso, dayEvents]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = minutesToPx(START_HOUR * 60);
  }, [iso]);

  const handleCreate = (input: Omit<Event, 'id'>) => create(input).then(() => setModalEvent(undefined));
  const handleUpdate = (id: string, patch: Partial<Event>) => update(id, patch).then(() => setModalEvent(undefined));
  const handleDelete = (id: string) => remove(id).then(() => setModalEvent(undefined));

  const eventBg = colorTint(color, 22);
  const eventBorder = colorHex(color);

  return (
    <section className="wtl">
      <header className="wtl__head">
        <h2 className="wpage__subtitle">Events</h2>
        <button type="button" className="wtl__add" onClick={() => setModalEvent(null)}>
          <Icon name="plus" size={16} />
          Add
        </button>
      </header>

      <div className="wtl__nav">
        <button type="button" className="wtl__nav-btn" onClick={() => setDay((d) => addDays(d, -1))} aria-label="Previous day">
          <Icon name="chevron-left" size={16} />
        </button>
        <span className="wtl__date">
          {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {isToday && <span className="wtl__today">Today</span>}
        </span>
        <button type="button" className="wtl__nav-btn" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Next day">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <div className="wtl__scroll" ref={scrollRef}>
        <div className="wtl__grid" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          <div className="wtl__axis">
            {HOURS.map((hour) => (
              <div key={hour} className="wtl__hour" style={{ height: HOUR_HEIGHT }}>
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div className="wtl__col">
            {blocks.map((item) => {
              if (item.kind !== 'event') return null;
              const { left, width } = columnBox(item.col, item.cols, item.reserve);
              return (
                <div
                  key={item.key}
                  className="wtl__event"
                  style={{
                    top: minutesToPx(item.startMin),
                    height: blockHeight(item.startMin, item.endMin),
                    left,
                    width,
                    background: eventBg,
                    borderLeftColor: eventBorder,
                  }}
                  onClick={() => setModalEvent(item.event)}
                  title={`${eventTimeRange(item.event)} ${item.event.title}`}
                >
                  <span className="wtl__event-title">{item.event.title}</span>
                  <span className="wtl__event-time">{eventTimeRange(item.event)}</span>
                  <span className="wtl__event-bell">
                    <ReminderBell
                      compact
                      reminder={reminderForEvent(item.event.id)}
                      anchorISO={item.event.startTime.slice(0, 16)}
                      onSet={(time) => setEventReminder(item.event.id, time)}
                      onClear={removeReminder}
                    />
                  </span>
                </div>
              );
            })}
            {dayEvents.length === 0 && <p className="wtl__empty">No events this day</p>}
          </div>
        </div>
      </div>

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          defaultDate={iso}
          defaultWorkspaceId={workspaceId}
          onClose={() => setModalEvent(undefined)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}
