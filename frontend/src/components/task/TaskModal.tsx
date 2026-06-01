import { useState, type FormEvent } from 'react';
import { priorityLabels, todayISO } from '@/lib/tasks';
import type { Task, TaskPriority } from '@/types/task';
import './TaskModal.css';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

interface TaskModalProps {
  task: Task | null;
  defaultDate?: string;
  onClose: () => void;
  onCreate: (input: Omit<Task, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, defaultDate, onClose, onCreate, onUpdate, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDate ?? todayISO());
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '');

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
    else onCreate({ ...data, status: 'TODO' });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__scrim" onClick={onClose} />
      <form className="modal__card" onSubmit={handleSubmit}>
        <h2 className="modal__title">{task ? 'Edit task' : 'New task'}</h2>

        <input
          className="modal__input"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
        />
        <input
          className="modal__input"
          placeholder="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

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
            <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
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
