import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFolders } from '@/api/folders';
import { getNotes } from '@/api/notes';
import { Icon } from '@/lib/icons';
import type { Folder } from '@/types/folder';
import './WorkspaceNotes.css';

const MAX = 3;

interface WorkspaceNotesProps {
  workspaceId: string;
}

type FolderRow = { folder: Folder; count: number };

export function WorkspaceNotes({ workspaceId }: WorkspaceNotesProps) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getFolders(), getNotes()])
      .then(([folders, notes]) => {
        if (!active) return;
        const counts = new Map<string, number>();
        notes.forEach((note) => counts.set(note.folderId, (counts.get(note.folderId) ?? 0) + 1));
        const scoped = folders
          .filter((folder) => folder.workspaceId === workspaceId)
          .map((folder) => ({ folder, count: counts.get(folder.id) ?? 0 }));
        setRows(scoped);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const visible = rows.slice(0, MAX);
  const more = rows.length - visible.length;

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
        <ul className="wnotes__list">
          {visible.map(({ folder, count }) => (
            <li key={folder.id}>
              <button type="button" className="wnotes__row" onClick={() => navigate('/notes')}>
                <span className="wnotes__folder-name">
                  <Icon name="folder" size={15} />
                  <span className="wnotes__folder-label">{folder.name}</span>
                </span>
                <span className="wnotes__count">{count}</span>
              </button>
            </li>
          ))}
          {more > 0 && <li className="wnotes__more">+{more} more</li>}
        </ul>
      ) : (
        <p className="wnotes__muted">No folders yet.</p>
      )}
    </section>
  );
}
