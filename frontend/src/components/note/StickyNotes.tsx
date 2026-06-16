import { type CSSProperties } from 'react';
import './StickyNotes.css';

const TILTS = ['-2deg', '1.5deg', '-1.5deg', '2deg'];

export interface StickyItem {
  id: string;
  title?: string;
  text?: string;
}

interface StickyNotesProps {
  items: StickyItem[];
  more?: number;
  onOpen: (id: string) => void;
}

/** Shows notes as sticky notes on a board, each at a slight angle, with an optional "+N more" tile. */
export function StickyNotes({ items, more = 0, onOpen }: StickyNotesProps) {
  return (
    <>
      <div className="sticky-notes">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="sticky-notes__pin"
            style={{ '--tilt': TILTS[index % TILTS.length] } as CSSProperties}
            onClick={() => onOpen(item.id)}
          >
            <span className="sticky-notes__tack" />
            {item.title && <span className="sticky-notes__title">{item.title}</span>}
            {item.text && <span className="sticky-notes__text">{item.text}</span>}
          </button>
        ))}
      </div>
      {more > 0 && <p className="sticky-notes__more">+{more} more</p>}
    </>
  );
}
