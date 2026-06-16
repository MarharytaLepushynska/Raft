import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/lib/icons';
import { toDateTimeLocal } from '@/lib/calendar';
import type { Reminder } from '@/types/reminder';
import './ReminderBell.css';

interface ReminderBellProps {
  reminder: Reminder | null;
  anchorISO?: string;
  compact?: boolean;
  onSet: (reminderTime: string) => void;
  onClear?: (id: string) => void;
}

const PRESETS: { label: string; ms: number }[] = [
  { label: '10 minutes before', ms: 10 * 60_000 },
  { label: '1 hour before', ms: 60 * 60_000 },
  { label: '1 day before', ms: 24 * 60 * 60_000 },
];

/** Builds the "X before" preset times from the anchor, keeping only those still in the future. */
function buildPresets(anchorISO: string | undefined): { label: string; value: string }[] {
  if (!anchorISO) return [];
  const anchor = new Date(anchorISO);
  if (Number.isNaN(anchor.getTime())) return [];
  const now = Date.now();
  return PRESETS.map((preset) => ({ label: preset.label, date: new Date(anchor.getTime() - preset.ms) }))
    .filter((preset) => preset.date.getTime() > now)
    .map((preset) => ({ label: preset.label, value: toDateTimeLocal(preset.date) }));
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Bell button that opens a popover to add, reschedule, or remove a reminder for a task or event. */
export function ReminderBell({ reminder, anchorISO, compact, onSet, onClear }: ReminderBellProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [custom, setCustom] = useState('');
  const [presets, setPresets] = useState<{ label: string; value: string }[]>([]);
  const [minCustom, setMinCustom] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const toggle = (event: MouseEvent) => {
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.min(rect.left, window.innerWidth - 250);
      const y = Math.min(rect.bottom + 6, window.innerHeight - 270);
      setPos({ x, y });
    }
    setPresets(buildPresets(anchorISO));
    setMinCustom(toDateTimeLocal(new Date(Date.now() + 60_000)));
    setCustom('');
    setOpen(true);
  };

  const pick = (value: string) => {
    onSet(value);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`reminder-bell${compact ? ' reminder-bell--compact' : ''}${reminder ? ' reminder-bell--active' : ''}`}
        onClick={toggle}
        aria-label={reminder ? 'Edit reminder' : 'Add reminder'}
        title={reminder ? `Reminder: ${formatWhen(reminder.reminderTime)}` : 'Add reminder'}
      >
        <Icon name={reminder ? 'bell-ring' : 'bell'} size={compact ? 13 : 16} />
      </button>

      {open && pos && createPortal(
        <div
          className="reminder-pop"
          style={{ left: pos.x, top: pos.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {reminder ? (
            <div className="reminder-pop__current">
              <span className="reminder-pop__when">Reminds {formatWhen(reminder.reminderTime)}</span>
              <button
                type="button"
                className="reminder-pop__remove"
                onClick={() => {
                  onClear?.(reminder.id);
                  setOpen(false);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <span className="reminder-pop__title">Remind me</span>
          )}

          {presets.length > 0 && (
            <div className="reminder-pop__presets">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="reminder-pop__preset"
                  onClick={() => pick(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <div className="reminder-pop__custom">
            <input
              type="datetime-local"
              className="reminder-pop__input"
              min={minCustom}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
            />
            <button
              type="button"
              className="reminder-pop__set"
              disabled={!custom}
              onClick={() => custom && pick(custom)}
            >
              Set
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
