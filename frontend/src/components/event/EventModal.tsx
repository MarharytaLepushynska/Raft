import { useEffect, useState, type FormEvent } from 'react';
import { todayISO } from '@/lib/tasks';
import { getWorkspaces } from '@/api/workspaces';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ReminderBell } from '@/components/reminder/ReminderBell';
import type { Event } from '@/types/event';
import type { Workspace } from '@/types/workspace';
import type { Reminder } from '@/types/reminder';

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 255;

interface EventModalProps {
  event: Event | null;
  defaultDate?: string;
  defaultWorkspaceId?: string;
  reminder?: Reminder | null;
  onClose: () => void;
  onCreate: (input: Omit<Event, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Event>) => void;
  onDelete: (id: string) => void;
  onSetReminder?: (reminderTime: string) => void;
  onClearReminder?: (id: string) => void;
}

export function EventModal({ event, defaultDate, defaultWorkspaceId, reminder, onClose, onCreate, onUpdate, onDelete, onSetReminder, onClearReminder }: EventModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>(event ? 'view' : 'edit');
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event ? event.startTime.slice(0, 10) : defaultDate ?? todayISO());
  const [startTime, setStartTime] = useState(event ? event.startTime.slice(11, 16) : '');
  const [endDate, setEndDate] = useState(event ? event.endTime.slice(0, 10) : defaultDate ?? todayISO());
  const [endTime, setEndTime] = useState(event ? event.endTime.slice(11, 16) : '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (event || defaultWorkspaceId) return;
    getWorkspaces().then((all) => {
      setWorkspaces(all);
      const preferred = all.find((w) => w.type === 'PERSONAL') ?? all[0];
      if (preferred) setWorkspaceId(preferred.id);
    });
  }, [event, defaultWorkspaceId]);

  const handleSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (!startTime || !endTime) {
      setError('Enter start and end time');
      return;
    }
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    if (end <= start) {
      setError('End must be after start');
      return;
    }
    const data = {
      title: trimmed,
      description: description.trim() || undefined,
      startTime: start,
      endTime: end,
    };
    if (event) onUpdate(event.id, data);
    else onCreate({ ...data, workspaceId: workspaceId || undefined });
  };

  const cancelEdit = () => {
    if (!event) {
      onClose();
      return;
    }
    setTitle(event.title);
    setDescription(event.description ?? '');
    setStartDate(event.startTime.slice(0, 10));
    setStartTime(event.startTime.slice(11, 16));
    setEndDate(event.endTime.slice(0, 10));
    setEndTime(event.endTime.slice(11, 16));
    setError('');
    setMode('view');
  };

  if (confirmingDelete && event) {
    return (
      <ConfirmModal
        title="Delete event?"
        text={<>This permanently deletes &ldquo;{event.title}&rdquo;. This can&rsquo;t be undone.</>}
        confirmLabel="Delete"
        onConfirm={() => onDelete(event.id)}
        onCancel={() => setConfirmingDelete(false)}
      />
    );
  }

  if (mode === 'view' && event) {
    const sDate = event.startTime.slice(0, 10);
    const eDate = event.endTime.slice(0, 10);
    const sTime = event.startTime.slice(11, 16);
    const eTime = event.endTime.slice(11, 16);
    const fmtDate = (iso: string) =>
      new Date(`${iso}T00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const when =
      sDate === eDate
        ? `${fmtDate(sDate)} · ${sTime}–${eTime}`
        : `${fmtDate(sDate)} ${sTime} → ${fmtDate(eDate)} ${eTime}`;
    return (
      <Modal onClose={onClose}>
        <h2 className="modal__title">{event.title}</h2>
        <div className="modal__view">
          <div className="modal__view-row">
            <span>When</span>
            <b>{when}</b>
          </div>
          {event.workspaceName && (
            <div className="modal__view-row">
              <span>Space</span>
              <b>{event.workspaceName}</b>
            </div>
          )}
          {onSetReminder && (
            <div className="modal__view-row">
              <span>Reminder</span>
              <ReminderBell
                reminder={reminder ?? null}
                anchorISO={event.startTime.slice(0, 16)}
                onSet={onSetReminder}
                onClear={onClearReminder}
              />
            </div>
          )}
          {event.description && <p className="modal__view-desc">{event.description}</p>}
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
      <h2 className="modal__title">{event ? 'Edit event' : 'New event'}</h2>
      {error && <div className="modal__error">{error}</div>}

      <label className="modal__field modal__field--full">
        <span>Title</span>
        <input
          className="modal__input"
          placeholder="Event title"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <span className="modal__counter">{title.length}/{TITLE_MAX}</span>
      </label>

      <label className="modal__field modal__field--full">
        <span>Description</span>
        <input
          className="modal__input"
          placeholder="Description (optional)"
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="modal__counter">{description.length}/{DESCRIPTION_MAX}</span>
      </label>

      {!event && !defaultWorkspaceId && workspaces.length > 0 && (
        <label className="modal__field modal__field--full">
          <span>Space</span>
          <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}>
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
          <span>Starts</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="modal__field">
          <span>Start time</span>
          <input type="time" lang="en-GB" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
      </div>

      <div className="modal__row">
        <label className="modal__field">
          <span>Ends</span>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="modal__field">
          <span>End time</span>
          <input type="time" lang="en-GB" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>

      <div className="modal__actions">
        {event && (
          <button type="button" className="modal__btn modal__btn--danger" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        )}
        <span className="modal__spacer" />
        <button type="button" className="modal__btn modal__btn--ghost" onClick={cancelEdit}>
          Cancel
        </button>
        <button type="submit" className="modal__btn modal__btn--primary" disabled={!title.trim()}>
          {event ? 'Save' : 'Add'}
        </button>
      </div>
    </Modal>
  );
}
