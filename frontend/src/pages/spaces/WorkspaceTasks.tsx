import { useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { createTask, deleteTask, getTasks, updateTask } from '@/api/tasks';
import { TaskModal } from '@/components/task/TaskModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { SingleSelectFilter } from '@/components/common/SingleSelectFilter';
import {
  byDeadline,
  byPriority,
  formatTaskDue,
  getTaskState,
  nextStatus,
  PRIORITIES,
  priorityColors,
  priorityLabels,
  statusLabels,
} from '@/lib/tasks';
import type { Task } from '@/types/task';
import type { WorkspaceDetail } from '@/types/workspace';
import './WorkspaceTasks.css';

type StatusFilter = 'all' | 'active' | 'completed';
type SortKey = 'deadline' | 'priority';

interface WorkspaceTasksProps {
  workspaceId: string;
  detail: WorkspaceDetail;
  currentUserId?: string;
}

export function WorkspaceTasks({ workspaceId, detail, currentUserId }: WorkspaceTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('deadline');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    getTasks()
      .then((all) => {
        if (active) setTasks(all.filter((task) => task.workspaceId === workspaceId));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const cycleStatus = async (task: Task) => {
    const updated = await updateTask(task.id, { status: nextStatus[task.status] });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const assignToMe = async (task: Task) => {
    if (!currentUserId) return;
    const updated = await updateTask(task.id, { assigneeId: currentUserId });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const create = async (input: Omit<Task, 'id'>) => {
    const created = await createTask(input);
    if (created.workspaceId === workspaceId) setTasks((prev) => [created, ...prev]);
    setModalTask(undefined);
  };

  const update = async (taskId: string, patch: Partial<Task>) => {
    const updated = await updateTask(taskId, patch);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    setModalTask(undefined);
  };

  const remove = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setModalTask(undefined);
  };

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const donePercent = total ? (doneCount / total) * 100 : 0;
  const progressPercent = total ? (inProgressCount / total) * 100 : 0;

  const sortFn = sort === 'priority' ? byPriority : byDeadline;
  const matchesPriority = (t: Task) => priorityFilter.size === 0 || priorityFilter.has(t.priority);
  const matchesAssignee = (t: Task) => {
    if (assigneeFilter.size === 0) return true;
    return t.assignee ? assigneeFilter.has(t.assignee.id) : assigneeFilter.has('none');
  };
  const matches = (t: Task) => matchesPriority(t) && matchesAssignee(t);
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED').filter(matches).sort(sortFn);
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').filter(matches).sort(sortFn);
  const showsActive = statusFilter !== 'completed' && activeTasks.length > 0;
  const showsCompleted = statusFilter !== 'active' && completedTasks.length > 0;

  const priorityOptions = PRIORITIES.map((p) => ({ id: p, label: priorityLabels[p], color: priorityColors[p] }));
  const assigneeOptions = [
    { id: 'none', label: 'Unassigned' },
    ...detail.members.map((m) => ({
      id: m.userId,
      label: `${m.firstName} ${m.lastName}`,
      sublabel: `@${m.username}`,
      badge: m.userId === currentUserId ? 'you' : undefined,
    })),
  ];

  const renderTask = (task: Task) => {
    const done = task.status === 'COMPLETED';
    const overdue = getTaskState(task) === 'overdue';
    return (
      <li key={task.id} className="wpage__task" data-done={done}>
        <button
          type="button"
          className="wpage__status"
          data-status={task.status}
          onClick={() => cycleStatus(task)}
          aria-label={`Status: ${statusLabels[task.status]}, click to change`}
        >
          <span className="wpage__status-dot">{done && <Icon name="check" size={12} />}</span>
          <span className="wpage__status-tip">
            {statusLabels[task.status]}
            <span className="wpage__status-tip-sub">click to change</span>
          </span>
        </button>
        <div className="wpage__task-body" onClick={() => setModalTask(task)}>
          <div className="wpage__task-head">
            <span className="wpage__task-title">{task.title}</span>
            <span className={`wpage__task-priority wpage__task-priority--${task.priority.toLowerCase()}`}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          {task.description && <p className="wpage__task-desc">{task.description}</p>}
          <p className="wpage__task-due" data-overdue={overdue}>
            {formatTaskDue(task)}
          </p>
          {detail.type === 'SHARED' && (
            <div className="wpage__task-author">
              {task.assignee ? (
                <span className="wpage__task-assignee">
                  {task.assignee.id === currentUserId ? 'You' : `${task.assignee.firstName} ${task.assignee.lastName}`}
                </span>
              ) : currentUserId ? (
                <button
                  type="button"
                  className="wpage__task-claim"
                  onClick={(event) => {
                    event.stopPropagation();
                    assignToMe(task);
                  }}
                >
                  <span className="wpage__task-claim-idle">Unassigned</span>
                  <span className="wpage__task-claim-hover">Assign to me</span>
                </button>
              ) : (
                <span className="wpage__task-unassigned">Unassigned</span>
              )}
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="wpage__main">
      <div className="wpage__tasks-head">
        <h2 className="wpage__subtitle">Tasks ({total - doneCount})</h2>
        <button type="button" className="wpage__add" onClick={() => setModalTask(null)}>
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      {total > 0 && (
        <div className="wpage__progress">
          <div className="wpage__progress-track">
            <span className="wpage__progress-fill wpage__progress-fill--done" style={{ width: `${donePercent}%` }} />
            <span className="wpage__progress-fill wpage__progress-fill--progress" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="wpage__progress-label">
            {doneCount} of {total} done · {percent}%
          </span>
        </div>
      )}

      {total > 0 && (
        <div className="wpage__filters">
          <div className="wpage__chips">
            {(['all', 'active', 'completed'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="wpage__chip"
                data-active={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <MultiSelectFilter
            options={priorityOptions}
            selected={priorityFilter}
            onChange={setPriorityFilter}
            allLabel="All priorities"
            countNoun="priorities"
          />
          {detail.type === 'SHARED' && (
            <MultiSelectFilter
              options={assigneeOptions}
              selected={assigneeFilter}
              onChange={setAssigneeFilter}
              allLabel="Anyone"
              countNoun="people"
            />
          )}
          <SingleSelectFilter
            options={[
              { id: 'deadline', label: 'By date' },
              { id: 'priority', label: 'By priority' },
            ]}
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
          />
        </div>
      )}

      {total === 0 ? (
        <p className="wpage__muted">No tasks in this space yet.</p>
      ) : !showsActive && !showsCompleted ? (
        <p className="wpage__muted">No tasks match the filters.</p>
      ) : (
        <>
          {showsActive && <ul className="wpage__list">{activeTasks.map(renderTask)}</ul>}

          {showsCompleted && (
            statusFilter === 'completed' ? (
              <ul className="wpage__list">{completedTasks.map(renderTask)}</ul>
            ) : (
              <div className="wpage__completed">
                <button
                  type="button"
                  className="wpage__completed-toggle"
                  data-open={showCompleted}
                  onClick={() => setShowCompleted((value) => !value)}
                >
                  <Icon name="chevron-down" size={16} />
                  Completed ({completedTasks.length})
                </button>
                {showCompleted && (
                  <ul className="wpage__list wpage__completed-list">{completedTasks.map(renderTask)}</ul>
                )}
              </div>
            )
          )}
        </>
      )}

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          defaultWorkspaceId={workspaceId}
          members={detail.type === 'SHARED' ? detail.members : undefined}
          onClose={() => setModalTask(undefined)}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      )}
    </div>
  );
}
