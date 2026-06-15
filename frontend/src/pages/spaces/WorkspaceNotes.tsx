import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFolders } from '@/api/folders';
import { getNotes } from '@/api/notes';
import { formatDate } from '@/lib/notes';
import { NoteViewModal } from '@/components/note/NoteViewModal';
import type { Note } from '@/types/note';
import './WorkspaceNotes.css';

const MAX = 3;

interface WorkspaceNotesProps {
  workspaceId: string;
}

export function WorkspaceNotes({ workspaceId }: WorkspaceNotesProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewNote, setViewNote] = useState<Note | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getFolders(), getNotes()])
      .then(([folders, allNotes]) => {
        if (!active) return;
        const folderIds = new Set(
          folders.filter((folder) => folder.workspaceId === workspaceId).map((folder) => folder.id),
        );
        const scoped = allNotes
          .filter((note) => folderIds.has(note.folderId))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setNotes(scoped);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const visible = notes.slice(0, MAX);
  const more = notes.length - visible.length;

  return (
    <section className="wnotes">
      <header className="wnotes__head">
        <h2 className="wpage__subtitle">Notes</h2>
        <Link to="/notes" className="wnotes__all">
          All notes
        </Link>
      </header>

      {loading ? (
        <p className="wnotes__muted">Loading&hellip;</p>
      ) : visible.length > 0 ? (
        <>
          <ul className="wnotes__list">
            {visible.map((note) => (
              <li key={note.id}>
                <button type="button" className="wnotes__row" onClick={() => setViewNote(note)}>
                  <span className="wnotes__row-title">{note.title}</span>
                  <span className="wnotes__row-meta">
                    <span className="wnotes__folder">{note.folderName}</span>
                    <span className="wnotes__date">{formatDate(note.updatedAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {more > 0 && <p className="wnotes__more">+{more} more</p>}
        </>
      ) : (
        <p className="wnotes__muted">No notes yet.</p>
      )}

      {viewNote && (
        <NoteViewModal
          note={viewNote}
          isPersonal={viewNote.folderType === 'PERSONAL'}
          onClose={() => setViewNote(null)}
          onEdit={() => navigate('/notes')}
        />
      )}
    </section>
  );
}
