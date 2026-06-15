import { useEffect, useState, type FormEvent } from 'react';
import { formatTaskDue, priorityLabels, statusLabels, taskAnchorISO, todayISO } from '@/lib/tasks';
import { useAuth } from '@/auth/AuthContext';
import { getWorkspaces } from '@/api/workspaces';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ReminderBell } from '@/components/reminder/ReminderBell';
import type { Task, TaskPriority } from '@/types/task';
import type { Member, Workspace } from '@/types/workspace';
import type { Reminder } from '@/types/reminder';
import './TaskModal.css';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 255;

interface TaskModalProps {
  task: Task | null;
  defaultDate?: string;
  defaultWorkspaceId?: string;
  members?: Member[];
  reminder?: Reminder | null;
  onClose: () => void;
  onCreate: (input: Omit<Task, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onSetReminder?: (reminderTime: string) => void;
  onClearReminder?: (id: string) => void;
}

export function TaskModal({ task, defaultDate, defaultWorkspaceId, members, reminder, onClose, onCreate, onUpdate, onDelete, onSetReminder, onClearReminder }: TaskModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>(task ? 'view' : 'edit');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDate ?? todayISO());
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');

  const canAssign = !!members && members.length > 0;

  useEffect(() => {
    if (task) return;
    if (defaultWorkspaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspaceId(defaultWorkspaceId);
      return;
    }
    getWorkspaces().then((all) => {
      setWorkspaces(all);
      const preferred = all.find((w) => w.type === 'PERSONAL') ?? all[0];
      if (preferred) setWorkspaceId(preferred.id);
    });
  }, [task, defaultWorkspaceId]);

  const cancelEdit = () => {
    if (!task) {
      onClose();
      return;
    }
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime ?? '');
    setAssigneeId(task.assignee?.id ?? '');
    setMode('view');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const data = {
      title: trimmed,
      description: description.trim() || undefined,
      priority,
      dueDate,
      dueTime: dueTime || undefined,
      ...(canAssign ? { assigneeId } : {}),
    };
    if (task) onUpdate(task.id, data);
    else onCreate({ ...data, status: 'TODO', workspaceId: workspaceId || undefined });
  };

  if (confirmingDelete && task) {
    return (
      <ConfirmModal
        title="Delete task?"
        text={<>This permanently deletes &ldquo;{task.title}&rdquo;. This can&rsquo;t be undone.</>}
        confirmLabel="Delete"
        onConfirm={() => onDelete(task.id)}
        onCancel={() => setConfirmingDelete(false)}
      />
    );
  }

  if (mode === 'view' && task) {
    const showCreator = !!task.creator && task.workspaceType !== 'PERSONAL';
    const createdText = task.created
      ? new Date(task.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return (
      <Modal onClose={onClose}>
        <div className="modal__head-row">
          <h2 className="modal__title">{task.title}</h2>
          {onSetReminder && (
            <ReminderBell
              reminder={reminder ?? null}
              anchorISO={taskAnchorISO(task)}
              onSet={onSetReminder}
              onClear={onClearReminder}
            />
          )}
        </div>

          <div className="modal__view">
            <div className="modal__view-row">
              <span>Status</span>
              <b>{statusLabels[task.status]}</b>
            </div>
            <div className="modal__view-row">
              <span>Priority</span>
              <b>{priorityLabels[task.priority]}</b>
            </div>
            <div className="modal__view-row">
              <span>Due</span>
              <b>{formatTaskDue(task)}</b>
            </div>
            {task.workspaceName && (
              <div className="modal__view-row">
                <span>Space</span>
                <b>{task.workspaceName}</b>
              </div>
            )}
            {task.assignee && (
              <div className="modal__view-row">
                <span>Assignee</span>
                <b>{task.assignee.firstName} {task.assignee.lastName}</b>
              </div>
            )}
            {task.description && <p className="modal__view-desc">{task.description}</p>}

            {(showCreator || createdText) && (
              <p className="modal__view-meta">
                {showCreator
                  ? `Added by ${task.creator!.firstName} ${task.creator!.lastName}${createdText ? ` · ${createdText}` : ''}`
                  : `Created ${createdText}`}
              </p>
            )}
          </div>

          <div className="modal__actions">
            <button type="button" className="modal__btn modal__btn--danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
            <span className="modal__spacer" />
            <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
              Close
            </button>
            <button type="button" className="modal__btn modal__btn--primary" onClick={() => setMode('edit')}>
              Edit
            </button>
          </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} as="form" onSubmit={handleSubmit}>
      <h2 className="modal__title">{task ? 'Edit task' : 'New task'}</h2>

        <label className="modal__field-wrap">
          <span className="modal__label">Title</span>
          <input
            className="modal__input"
            placeholder="Task title"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <span className="modal__counter">{title.length}/{TITLE_MAX}</span>
        </label>
        <label className="modal__field-wrap">
          <span className="modal__label">Description</span>
          <input
            className="modal__input"
            placeholder="Description (optional)"
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="modal__counter">{description.length}/{DESCRIPTION_MAX}</span>
        </label>

        {!task && !defaultWorkspaceId && workspaces.length > 0 && (
          <label className="modal__field modal__field--full">
            <span>Space</span>
            <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {canAssign && (
          <div className="modal__field modal__field--full">
            <div className="modal__field-head">
              <span>Assignee</span>
              {user && assigneeId !== user.id && (
                <button type="button" className="modal__link" onClick={() => setAssigneeId(user.id)}>
                  Assign to me
                </button>
              )}
            </div>
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">Unassigned</option>
              {members!.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal__row">
          <label className="modal__field">
            <span>Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {priorityLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="modal__field">
            <span>Date</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label className="modal__field">
            <span>Time</span>
            <input
              type="time"
              lang="en-GB"
              value={dueTime}
              onChange={(event) => setDueTime(event.target.value)}
            />
          </label>
        </div>

        <div className="modal__actions">
          {task && (
            <button type="button" className="modal__btn modal__btn--danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          )}
          <span className="modal__spacer" />
          <button type="button" className="modal__btn modal__btn--ghost" onClick={cancelEdit}>
            Cancel
          </button>
          <button type="submit" className="modal__btn modal__btn--primary" disabled={!title.trim()}>
            {task ? 'Save' : 'Add'}
          </button>
        </div>
    </Modal>
  );
}
