import { useMemo, useState } from 'react';
import { TaskModal } from '@/components/task/TaskModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { byDeadline, defaultAssigneeId, formatTaskDue, getTaskState, isDueOn, isMyTask, priorityLabels, priorityOptions, todayISO } from '@/lib/tasks';
import { useTasks } from '@/hooks/tasks/useTasks';
import { useWorkspaces } from '@/hooks/workspaces/useWorkspaces';
import { capitalize } from '@/lib/utils';
import { colorHex } from '@/lib/workspaceColors';
import type { Task } from '@/types/task';
import './TodoPage.css';

type StatusFilter = 'all' | 'active' | 'completed';

export function TodoPage() {
  const { user } = useAuth();
  const { tasks, loading, create, update, remove } = useTasks();
  const { workspaces, spaceOptions } = useWorkspaces();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(() => new Set());
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(() => new Set());
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);

  const toggle = (task: Task) =>
    update(task.id, { status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' });

  const handleCreate = (input: Omit<Task, 'id'>) =>
    create({ ...input, assigneeId: defaultAssigneeId(input.workspaceId, workspaces, user?.id) }).then(() =>
      setModalTask(undefined),
    );
  const handleUpdate = (id: string, patch: Partial<Task>) => update(id, patch).then(() => setModalTask(undefined));
  const handleDelete = (id: string) => remove(id).then(() => setModalTask(undefined));

  const remaining = tasks.filter((task) => isMyTask(task, user?.id) && task.status !== 'COMPLETED').length;

  const sections = useMemo(() => {
    const now = new Date();
    const today = todayISO(now);
    const query = search.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (!isMyTask(task, user?.id)) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      if (selectedPriorities.size > 0 && !selectedPriorities.has(task.priority)) return false;
      if (selectedSpaces.size > 0 && (!task.workspaceId || !selectedSpaces.has(task.workspaceId))) return false;
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
  }, [tasks, search, statusFilter, selectedPriorities, selectedSpaces, user?.id]);

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
                {capitalize(value)}
              </button>
            ))}
          </div>

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
                        <span
                          className="todo-task__space-dot"
                          style={{ background: colorHex(task.workspaceColor) }}
                          title={task.workspaceName}
                        />
                        <span className="todo-task__title">{task.title}</span>
                        <span className={`todo-task__priority todo-task__priority--${task.priority.toLowerCase()}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                      {task.description && <p className="todo-task__desc">{task.description}</p>}
                      <p className={`todo-task__meta${section.overdue ? ' todo-task__meta--overdue' : ''}`}>
                        {formatTaskDue(task)}
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
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
