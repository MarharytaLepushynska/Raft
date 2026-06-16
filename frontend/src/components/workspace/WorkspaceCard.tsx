import { colorHex } from '@/lib/workspaceColors';
import type { Workspace } from '@/types/workspace';
import './WorkspaceCard.css';

interface WorkspaceCardProps {
  workspace: Workspace;
  onOpen: (id: string) => void;
}

/** A workspace card with its color, name, type, and member count; opens the space on click. */
export function WorkspaceCard({ workspace, onOpen }: WorkspaceCardProps) {
  const members = workspace.memberCount ?? 1;
  return (
    <div
      className="scard"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(workspace.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(workspace.id);
      }}
    >
      <div className="scard__banner" style={{ background: colorHex(workspace.color) }} />
      <div className="scard__body">
        <div className="scard__top">
          <span className="scard__name">{workspace.name}</span>
          <span className="scard__type">{workspace.type === 'SHARED' ? 'Shared' : 'Personal'}</span>
        </div>
        <p className="scard__meta">
          {members} member{members === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}
