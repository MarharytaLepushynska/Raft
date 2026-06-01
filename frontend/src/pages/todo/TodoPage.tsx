import { useEffect, useMemo, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from '@/api/tasks';
import { TaskModal } from '@/components/task/TaskModal';
import { Icon } from '@/lib/icons';
import { byDeadline, getTaskState, isDueOn, priorityLabels, todayISO } from '@/lib/tasks';
import type { Task, TaskPriority } from '@/types/task';
import './TodoPage.css';

type StatusFilter = 'all' | 'active' | 'completed';
const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

function formatDeadline(task: Task): string {
  const date = new Date(`${task.dueDate}T${task.dueTime ?? '00:00'}`);
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return task.dueTime ? `${day} · ${task.dueTime}` : day;
}

export function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activePriorities, setActivePriorities] = useState<Set<TaskPriority>>(() => new Set(PRIORITIES));
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getTasks().then((all) => {
      if (active) {
        setTasks(all);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (task: Task) => {
    const next = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updated = await updateTask(task.id, { status: next });
    setTasks((prev) => prev.map((item) => (item.id === task.id ? updated : item)));
  };

  const create = async (input: Omit<Task, 'id'>) => {
    const task = await createTask(input);
    setTasks((prev) => [task, ...prev]);
    setModalTask(undefined);
  };

  const update = async (id: string, patch: Partial<Task>) => {
    const updated = await updateTask(id, patch);
    setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setModalTask(undefined);
  };

  const remove = async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((item) => item.id !== id));
    setModalTask(undefined);
  };

  const togglePriority = (priority: TaskPriority) =>
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });

  const remaining = tasks.filter((task) => task.status !== 'COMPLETED').length;

  const sections = useMemo(() => {
    const now = new Date();
    const today = todayISO(now);
    const query = search.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query)) return false;
      if (!activePriorities.has(task.priority)) return false;
      if (statusFilter === 'active' && task.status === 'COMPLETED') return false;
      if (statusFilter === 'completed' && task.status !== 'COMPLETED') return false;
      return true;
    });

    const withState = filtered.map((task) => ({ task, state: getTaskState(task, now) }));
    const pick = (fn: (x: { task: Task; state: ReturnType<typeof getTaskState> }) => boolean) =>
      withState.filter(fn).map((x) => x.task).sort(byDeadline);

    return [
      { key: 'overdue', title: 'Overdue', overdue: true, tasks: pick((x) => x.state === 'overdue') },
      { key: 'today', title: 'Today', overdue: false, tasks: pick((x) => x.state === 'upcoming' && isDueOn(x.task, today)) },
      { key: 'upcoming', title: 'Upcoming', overdue: false, tasks: pick((x) => x.state === 'upcoming' && !isDueOn(x.task, today)) },
      { key: 'completed', title: 'Completed', overdue: false, tasks: pick((x) => x.state === 'done') },
    ];
  }, [tasks, search, statusFilter, activePriorities]);

  const visibleSections = sections.filter((section) => section.tasks.length > 0);

  return (
    <div className="todo">
      {!loading && (
        <p className="todo__subtitle">
          {remaining === 0 ? 'All done — nice work!' : `${remaining} task${remaining === 1 ? '' : 's'} left`}
        </p>
      )}

      <div className="todo__toolbar">
        <div className="todo__top">
          <div className="todo__search">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button type="button" className="todo__add" onClick={() => setModalTask(null)}>
            <Icon name="plus" size={16} />
            Add task
          </button>
        </div>

        <div className="todo__filters">
          <div className="todo__chips">
            {(['all', 'active', 'completed'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="todo__chip"
                data-active={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="todo__priorities">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                className="todo__priority"
                data-active={activePriorities.has(priority)}
                onClick={() => togglePriority(priority)}
              >
                <span className={`todo__priority-dot todo__priority-dot--${priority.toLowerCase()}`} />
                {priorityLabels[priority]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="todo__muted">Loading&hellip;</p>
      ) : visibleSections.length === 0 ? (
        <p className="todo__muted">No tasks match your filters.</p>
      ) : (
        visibleSections.map((section) => (
          <section key={section.key} className="todo-section">
            <div className="todo-section__head">
              <h2 className={`todo-section__title${section.overdue ? ' todo-section__title--overdue' : ''}`}>
                {section.title}
              </h2>
              <span className="todo-section__count">{section.tasks.length}</span>
            </div>

            <ul className="todo-list">
              {section.tasks.map((task) => {
                const done = task.status === 'COMPLETED';
                return (
                  <li key={task.id} className={`todo-task${section.overdue ? ' todo-task--overdue' : ''}`} data-done={done}>
                    <input
                      type="checkbox"
                      className="todo-task__check"
                      checked={done}
                      onChange={() => {
                        toggle(task);
                      }}
                      aria-label={`Mark "${task.title}" as ${done ? 'not done' : 'done'}`}
                    />
                    <div className="todo-task__body" onClick={() => setModalTask(task)}>
                      <div className="todo-task__head">
                        <span className="todo-task__title">{task.title}</span>
                        <span className={`todo-task__priority todo-task__priority--${task.priority.toLowerCase()}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                      {task.description && <p className="todo-task__desc">{task.description}</p>}
                      <p className={`todo-task__meta${section.overdue ? ' todo-task__meta--overdue' : ''}`}>
                        {formatDeadline(task)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(undefined)}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      )}
    </div>
  );
}
