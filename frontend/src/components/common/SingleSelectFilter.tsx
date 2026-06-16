import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/lib/icons';
import './SelectFilter.css';

export interface SingleSelectOption {
  id: string;
  label: string;
}

interface SingleSelectFilterProps {
  options: SingleSelectOption[];
  value: string;
  onChange: (id: string) => void;
  icon?: IconName;
}

/** A dropdown for picking a single option (e.g. the sort order). Closes after a pick or on outside click. */
export function SingleSelectFilter({ options, value, onChange, icon }: SingleSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((option) => option.id === value);

  return (
    <div className="selectfilter" ref={rootRef}>
      <button
        type="button"
        className="selectfilter__button"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {icon && <Icon name={icon} size={16} />}
        <span className="selectfilter__current">{current?.label}</span>
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <div className="selectfilter__menu">
          <div className="selectfilter__list">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="selectfilter__option"
                data-active={value === option.id}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span className="selectfilter__option-name">{option.label}</span>
                {value === option.id && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
