import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFolders } from '@/api/folders';
import { getNotes, createNote } from '@/api/notes';
import { Icon } from '@/lib/icons';
import { NoteViewModal } from '@/components/note/NoteViewModal';
import { NoteModal } from '@/components/note/NoteModal';
import { StickyNotes } from '@/components/note/StickyNotes';
import type { Note, CreateNoteInput } from '@/types/note';
import type { Folder } from '@/types/folder';
import './WorkspaceNotes.css';

const MAX = 4;
// no-op for NoteModal's required update/delete handlers - here it only creates
const notUsed = async () => {};

interface WorkspaceNotesProps {
  workspaceId: string;
}

/** A preview of the workspace's notes as sticky cards, with a quick-add and a link to the full Notes page. */
export function WorkspaceNotes({ workspaceId }: WorkspaceNotesProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([getFolders(), getNotes()]).then(([allFolders, allNotes]) => {
        const wsFolders = allFolders.filter((folder) => folder.workspaceId === workspaceId);
        const folderIds = new Set(wsFolders.map((folder) => folder.id));
        setFolders(wsFolders);
        setNotes(
          allNotes
            .filter((note) => folderIds.has(note.folderId))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      }),
    [workspaceId],
  );

  useEffect(() => {
    let active = true;
    load()
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load]);

  const handleCreate = (input: CreateNoteInput) =>
    createNote(input).then(load).then(() => setAdding(false));

  const openAdd = () => (folders.length > 0 ? setAdding(true) : navigate('/notes'));

  const visible = notes.slice(0, MAX);
  const more = notes.length - visible.length;

  return (
    <section className="wnotes">
      <header className="wnotes__head">
        <h2 className="wpage__subtitle">Notes</h2>
        <button type="button" className="wnotes__add" onClick={openAdd}>
          <Icon name="plus" size={16} />
          Add
        </button>
      </header>

      {loading ? (
        <p className="wnotes__muted">Loading&hellip;</p>
      ) : visible.length > 0 ? (
        <StickyNotes
          items={visible.map((note) => ({ id: note.id, title: note.title, text: note.content }))}
          more={more}
          onOpen={(id) => {
            const note = notes.find((item) => item.id === id);
            if (note) setViewNote(note);
          }}
        />
      ) : (
        <p className="wnotes__muted">No notes yet.</p>
      )}

      <Link to="/notes" className="wnotes__all">
        All notes
      </Link>

      {viewNote && (
        <NoteViewModal
          note={viewNote}
          isPersonal={viewNote.folderType === 'PERSONAL'}
          editLabel="Open in Notes"
          onClose={() => setViewNote(null)}
          onEdit={() => navigate('/notes')}
        />
      )}

      {adding && (
        <NoteModal
          note={null}
          folders={folders}
          onClose={() => setAdding(false)}
          onCreate={handleCreate}
          onUpdate={notUsed}
          onDelete={notUsed}
        />
      )}
    </section>
  );
}
