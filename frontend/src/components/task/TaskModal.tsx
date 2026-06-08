import { useEffect, useState, type FormEvent } from 'react';
import { priorityLabels, todayISO } from '@/lib/tasks';
import { getWorkspaces } from '@/api/workspaces';
import type { Task, TaskPriority } from '@/types/task';
import type { Workspace } from '@/types/workspace';
import './TaskModal.css';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 255;

interface TaskModalProps {
  task: Task | null;
  defaultDate?: string;
  defaultWorkspaceId?: string;
  onClose: () => void;
  onCreate: (input: Omit<Task, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, defaultDate, defaultWorkspaceId, onClose, onCreate, onUpdate, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDate ?? todayISO());
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');

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

  const handleTimeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const deleting = raw.length < dueTime.length;
    if (digits.length >= 3) {
      setDueTime(`${digits.slice(0, 2)}:${digits.slice(2)}`);
    } else if (digits.length === 2 && !deleting) {
      setDueTime(`${digits}:`);
    } else {
      setDueTime(digits);
    }
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
    };
    if (task) onUpdate(task.id, data);
    else onCreate({ ...data, status: 'TODO', workspaceId: workspaceId || undefined });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__scrim" onClick={onClose} />
      <form className="modal__card" onSubmit={handleSubmit}>
        <h2 className="modal__title">{task ? 'Edit task' : 'New task'}</h2>

        <div className="modal__field-wrap">
          <input
            className="modal__input"
            placeholder="Task title"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <span className="modal__counter">{title.length}/{TITLE_MAX}</span>
        </div>
        <div className="modal__field-wrap">
          <input
            className="modal__input"
            placeholder="Description (optional)"
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="modal__counter">{description.length}/{DESCRIPTION_MAX}</span>
        </div>

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
              type="text"
              inputMode="numeric"
              placeholder="HH:mm"
              maxLength={5}
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
              title="24-hour time, e.g. 14:30"
              value={dueTime}
              onChange={(event) => handleTimeChange(event.target.value)}
            />
          </label>
        </div>

        <div className="modal__actions">
          {task && (
            <button type="button" className="modal__btn modal__btn--danger" onClick={() => onDelete(task.id)}>
              Delete
            </button>
          )}
          <span className="modal__spacer" />
          <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="modal__btn modal__btn--primary" disabled={!title.trim()}>
            {task ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
