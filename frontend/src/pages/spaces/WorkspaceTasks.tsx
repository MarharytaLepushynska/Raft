import { useState } from 'react';
import { TaskModal } from '@/components/task/TaskModal';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { TaskBoard } from '@/components/common/TaskBoard';
import { ReminderBell } from '@/components/reminder/ReminderBell';
import { nextStatus, taskAnchorISO } from '@/lib/tasks';
import { useTasks } from '@/hooks/tasks/useTasks';
import { useReminders } from '@/hooks/inbox/useReminders';
import type { Task } from '@/types/task';
import type { WorkspaceDetail } from '@/types/workspace';
import './WorkspaceTasks.css';

interface WorkspaceTasksProps {
  workspaceId: string;
  detail: WorkspaceDetail;
  currentUserId?: string;
}

export function WorkspaceTasks({ workspaceId, detail, currentUserId }: WorkspaceTasksProps) {
  const { tasks, create, update, remove } = useTasks({ workspaceId });
  const { reminderForTask, setTaskReminder, remove: removeReminder } = useReminders();
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);

  const shared = detail.type === 'SHARED';

  const cycleStatus = (task: Task) => {
    const next = nextStatus[task.status];
    const patch: Partial<Task> = { status: next };
    if ((next === 'IN_PROGRESS' || next === 'COMPLETED') && !task.assignee && currentUserId) {
      patch.assigneeId = currentUserId;
    }
    return update(task.id, patch);
  };
  const assignToMe = (task: Task) => {
    if (currentUserId) update(task.id, { assigneeId: currentUserId });
  };

  const handleCreate = (input: Omit<Task, 'id'>) => create(input).then(() => setModalTask(undefined));
  const handleUpdate = (id: string, patch: Partial<Task>) => update(id, patch).then(() => setModalTask(undefined));
  const handleDelete = (id: string) => remove(id).then(() => setModalTask(undefined));

  const assigneeOptions = [
    { id: 'none', label: 'Unassigned' },
    ...detail.members.map((m) => ({
      id: m.userId,
      label: `${m.firstName} ${m.lastName}`,
      sublabel: `@${m.username}`,
      badge: m.userId === currentUserId ? 'you' : undefined,
    })),
  ];

  const matchAssignee = (task: Task) =>
    assigneeFilter.size === 0 || (task.assignee ? assigneeFilter.has(task.assignee.id) : assigneeFilter.has('none'));

  const renderAssignee = (task: Task) =>
    task.assignee ? (
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
    );

  return (
    <div className="wpage__main">
      <h2 className="wpage__subtitle">Tasks</h2>

      <TaskBoard
        tasks={tasks}
        emptyText="No tasks in this space yet."
        matchExtra={shared ? matchAssignee : undefined}
        renderAssignee={shared ? renderAssignee : undefined}
        extraFilter={
          shared ? (
            <MultiSelectFilter
              options={assigneeOptions}
              selected={assigneeFilter}
              onChange={setAssigneeFilter}
              allLabel="Anyone"
              countNoun="people"
            />
          ) : null
        }
        renderReminder={(task) => (
          <ReminderBell
            reminder={reminderForTask(task.id)}
            anchorISO={taskAnchorISO(task)}
            onSet={(time) => setTaskReminder(task.id, time)}
            onClear={removeReminder}
          />
        )}
        onSelect={setModalTask}
        onCycle={cycleStatus}
        onAdd={() => setModalTask(null)}
      />

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          defaultWorkspaceId={workspaceId}
          members={shared ? detail.members : undefined}
          onClose={() => setModalTask(undefined)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
