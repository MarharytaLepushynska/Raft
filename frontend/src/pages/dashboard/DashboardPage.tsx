import { useEffect, useState } from 'react';
import { getTasks, updateTask } from '@/api/tasks';
import { getEvents } from '@/api/events';
import { TodayTasksWidget } from '@/components/dashboard/TodayTasksWidget';
import { MiniCalendarWidget } from '@/components/dashboard/MiniCalendarWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { PinnedNotesWidget } from '@/components/dashboard/PinnedNotesWidget';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { SpacesWidget } from '@/components/dashboard/SpacesWidget';
import { useAuth } from '@/auth/AuthContext';
import { isMyTask } from '@/lib/tasks';
import type { Task } from '@/types/task';
import type { Event } from '@/types/event';
import './DashboardPage.css';

/** The home dashboard: a greeting and the widget grid (tasks, events, calendar, notes, stats, spaces). */
export function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getTasks()
      .then((all) => {
        if (active) setTasks(all);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getEvents()
      .then((all) => {
        if (active) setEvents(all);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const myTasks = tasks.filter((task) => isMyTask(task, user?.id));

  const handleComplete = (id: string) => {
    const prevStatus = tasks.find((task) => task.id === id)?.status;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: 'COMPLETED' } : task)));
    updateTask(id, { status: 'COMPLETED' }).catch(() => {
      setTasks((prev) =>
        prev.map((task) => (task.id === id && prevStatus ? { ...task, status: prevStatus } : task)),
      );
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard__layout">
        <div className="dashboard__main">
          <div className="dashboard__row">
            <TodayTasksWidget tasks={myTasks} loading={loading} error={error} onComplete={handleComplete} />
            <UpcomingEventsWidget events={events} />
          </div>
          <SpacesWidget />
        </div>

        <aside className="dashboard__side">
          <PinnedNotesWidget />
          <StatsWidget />
          <MiniCalendarWidget tasks={myTasks} events={events} />
        </aside>
      </div>
    </div>
  );
}
