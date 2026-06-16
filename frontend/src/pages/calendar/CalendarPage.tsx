import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskModal } from '@/components/task/TaskModal';
import { EventModal } from '@/components/event/EventModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { monthGridDays, toISODate, weekDays } from '@/lib/calendar';
import { Icon } from '@/lib/icons';
import { addDays, byDueTime, defaultAssigneeId, isMyTask, priorityOptions } from '@/lib/tasks';
import { useTasks } from '@/hooks/tasks/useTasks';
import { useEvents } from '@/hooks/events/useEvents';
import { useWorkspaces } from '@/hooks/workspaces/useWorkspaces';
import { useReminders } from '@/hooks/inbox/useReminders';
import { capitalize } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import { coveredDays } from './calendarLayout';
import { TimeGrid } from './TimeGrid';
import { MonthGrid } from './MonthGrid';
import './CalendarPage.css';

type View = 'month' | 'week' | 'day';

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** The Calendar page: month/week/day views of tasks and events, with filters and create/edit modals. */
export function CalendarPage() {
  const { user } = useAuth();
  const { tasks, create, update, remove } = useTasks();
  const { events, create: createEvent, update: updateEvent, remove: removeEvent } = useEvents();
  const { workspaces, spaceOptions } = useWorkspaces();
  const { reminderForTask, reminderForEvent, setTaskReminder, setEventReminder, remove: removeReminder } = useReminders();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [view, setView] = useState<View>(dateParam ? 'day' : 'month');
  const [focus, setFocus] = useState(() => {
    if (dateParam) {
      const parsed = new Date(`${dateParam}T00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
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
  const pickDay = (date: Date) => {
    setFocus(date);
    setView('day');
  };

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
          <MonthGrid
            days={monthGridDays(focus.getFullYear(), focus.getMonth())}
            month={focus.getMonth()}
            tasksByDate={tasksByDate}
            eventsByDay={eventsByDay}
            today={today}
            onPickDay={pickDay}
          />
        ) : (
          <TimeGrid
            days={view === 'week' ? weekDays(focus) : [focus]}
            tasksByDate={tasksByDate}
            eventsByDay={eventsByDay}
            today={today}
            maxCols={view === 'week' ? 3 : Infinity}
            onPickDay={pickDay}
            onSelectTask={setModalTask}
            onSelectEvent={setModalEvent}
            reminderForEvent={view === 'day' ? reminderForEvent : undefined}
            onSetEventReminder={view === 'day' ? (event, time) => setEventReminder(event.id, time) : undefined}
            onClearEventReminder={view === 'day' ? removeReminder : undefined}
            reminderForTask={view === 'day' ? reminderForTask : undefined}
            onSetTaskReminder={view === 'day' ? (task, time) => setTaskReminder(task.id, time) : undefined}
            onClearTaskReminder={view === 'day' ? removeReminder : undefined}
          />
        )}
      </div>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          defaultDate={toISODate(focus)}
          reminder={modalTask ? reminderForTask(modalTask.id) : null}
          onClose={() => setModalTask(undefined)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onSetReminder={view === 'week' && modalTask ? (time) => setTaskReminder(modalTask.id, time) : undefined}
          onClearReminder={removeReminder}
        />
      )}

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          defaultDate={toISODate(focus)}
          reminder={modalEvent ? reminderForEvent(modalEvent.id) : null}
          onClose={() => setModalEvent(undefined)}
          onCreate={handleEventCreate}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          onSetReminder={view === 'week' && modalEvent ? (time) => setEventReminder(modalEvent.id, time) : undefined}
          onClearReminder={removeReminder}
        />
      )}
    </div>
  );
}
