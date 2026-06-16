import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/lib/icons';
import './SelectFilter.css';

export interface FilterOption {
  id: string;
  label: string;
  color?: string;
  sublabel?: string;
  badge?: string;
}

interface MultiSelectFilterProps {
  options: FilterOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  allLabel: string;
  countNoun: string;
  icon?: IconName;
}

/** A dropdown to pick several options at once, with search, an "all" shortcut, and close-on-outside-click. */
export function MultiSelectFilter({
  options,
  selected,
  onChange,
  allLabel,
  countNoun,
  icon,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const single = selected.size === 1 ? options.find((o) => selected.has(o.id)) : undefined;
  const label = selected.size === 0 ? allLabel : single ? single.label : `${selected.size} ${countNoun}`;

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div className="selectfilter" ref={rootRef}>
      <button
        type="button"
        className="selectfilter__button"
        data-active={selected.size > 0}
        onClick={() => setOpen((value) => !value)}
      >
        {single?.color ? (
          <span className="selectfilter__dot" style={{ background: single.color }} />
        ) : icon ? (
          <Icon name={icon} size={16} />
        ) : null}
        <span className="selectfilter__current">{label}</span>
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <div className="selectfilter__menu">
          {options.length > 6 && (
            <input
              className="selectfilter__search"
              placeholder="Filter"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
          )}

          <button
            type="button"
            className="selectfilter__option"
            data-active={selected.size === 0}
            onClick={() => onChange(new Set())}
          >
            <span className="selectfilter__option-name">{allLabel}</span>
            {selected.size === 0 && <Icon name="check" size={16} />}
          </button>

          <div className="selectfilter__list">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                className="selectfilter__option"
                data-active={selected.has(option.id)}
                onClick={() => toggle(option.id)}
              >
                {option.color && <span className="selectfilter__dot" style={{ background: option.color }} />}
                <span className="selectfilter__option-name">{option.label}</span>
                {option.sublabel && <span className="selectfilter__option-sub">{option.sublabel}</span>}
                {option.badge && <span className="selectfilter__option-badge">{option.badge}</span>}
                {selected.has(option.id) && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
