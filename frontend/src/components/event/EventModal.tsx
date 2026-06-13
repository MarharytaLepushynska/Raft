import { useEffect, useState, type FormEvent } from 'react';
import { todayISO } from '@/lib/tasks';
import { getWorkspaces } from '@/api/workspaces';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import type { Event } from '@/types/event';
import type { Workspace } from '@/types/workspace';

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 255;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function formatTime(raw: string, prev: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  const deleting = raw.length < prev.length;
  if (digits.length >= 3) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  if (digits.length === 2 && !deleting) return `${digits}:`;
  return digits;
}

interface EventModalProps {
  event: Event | null;
  defaultDate?: string;
  onClose: () => void;
  onCreate: (input: Omit<Event, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Event>) => void;
  onDelete: (id: string) => void;
}

export function EventModal({ event, defaultDate, onClose, onCreate, onUpdate, onDelete }: EventModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event ? event.startTime.slice(0, 10) : defaultDate ?? todayISO());
  const [startTime, setStartTime] = useState(event ? event.startTime.slice(11, 16) : '');
  const [endDate, setEndDate] = useState(event ? event.endTime.slice(0, 10) : defaultDate ?? todayISO());
  const [endTime, setEndTime] = useState(event ? event.endTime.slice(11, 16) : '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) return;
    getWorkspaces().then((all) => {
      setWorkspaces(all);
      const preferred = all.find((w) => w.type === 'PERSONAL') ?? all[0];
      if (preferred) setWorkspaceId(preferred.id);
    });
  }, [event]);

  const handleSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setError('Enter start and end time as HH:mm');
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

      {!event && workspaces.length > 0 && (
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
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:mm"
            maxLength={5}
            value={startTime}
            onChange={(e) => setStartTime(formatTime(e.target.value, startTime))}
          />
        </label>
      </div>

      <div className="modal__row">
        <label className="modal__field">
          <span>Ends</span>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="modal__field">
          <span>End time</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:mm"
            maxLength={5}
            value={endTime}
            onChange={(e) => setEndTime(formatTime(e.target.value, endTime))}
          />
        </label>
      </div>

      <div className="modal__actions">
        {event && (
          <button type="button" className="modal__btn modal__btn--danger" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        )}
        <span className="modal__spacer" />
        <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="modal__btn modal__btn--primary" disabled={!title.trim()}>
          {event ? 'Save' : 'Add'}
        </button>
      </div>
    </Modal>
  );
}
