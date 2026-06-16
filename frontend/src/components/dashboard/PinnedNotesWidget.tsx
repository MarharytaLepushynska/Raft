import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPins } from '@/api/pins';
import { StickyNotes } from '@/components/note/StickyNotes';
import type { PinItem } from '@/types/pin';
import './PinnedNotesWidget.css';

const MAX = 4;

/** Dashboard widget: up to 4 pinned notes shown as stickies, linking to the notes page. */
export function PinnedNotesWidget() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<PinItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPins()
      .then((all) => {
        if (active) setPins(all.filter((pin) => Boolean(pin.noteId)));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = pins.slice(0, MAX);
  const more = pins.length - visible.length;

  return (
    <section className="pinned-notes">
      <header className="pinned-notes__head">
        <span className="pinned-notes__title">Pinned notes</span>
        <Link to="/notes" className="pinned-notes__all">
          All notes
        </Link>
      </header>

      {loading ? (
        <p className="pinned-notes__muted">Loading&hellip;</p>
      ) : visible.length > 0 ? (
        <StickyNotes
          items={visible.map((pin) => ({ id: pin.id, title: pin.title, text: pin.text }))}
          more={more}
          onOpen={() => navigate('/notes')}
        />
      ) : (
        <p className="pinned-notes__muted">Nothing pinned yet.</p>
      )}
    </section>
  );
}
