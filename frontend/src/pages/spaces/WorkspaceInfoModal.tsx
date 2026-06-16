import { useState, type FormEvent } from 'react';
import { updateWorkspace } from '@/api/workspaces';
import { colorHex, WORKSPACE_COLOR_NAMES } from '@/lib/workspaceColors';
import { Modal } from '@/components/common/Modal';
import type { WorkspaceColor, WorkspaceDetail } from '@/types/workspace';

function colorLabel(color: WorkspaceColor | null): string {
  if (!color) return '—';
  return color.charAt(0) + color.slice(1).toLowerCase();
}

interface WorkspaceInfoModalProps {
  detail: WorkspaceDetail;
  canEdit: boolean;
  onClose: () => void;
  onUpdated: (changes: { name: string; color: WorkspaceColor }) => void;
  onDelete: () => void;
  onLeave: () => void;
}

/** Modal showing a space's details, switching to an edit form, with delete (owner) or leave (member) actions. */
export function WorkspaceInfoModal({ detail, canEdit, onClose, onUpdated, onDelete, onLeave }: WorkspaceInfoModalProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(detail.name);
  const [editColor, setEditColor] = useState<WorkspaceColor>(detail.color ?? 'ROSE');

  const startEdit = () => {
    setEditName(detail.name);
    setEditColor(detail.color ?? 'ROSE');
    setEditing(true);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    const name = editName.trim();
    if (!name) return;
    await updateWorkspace(detail.id, { name, color: editColor });
    onUpdated({ name, color: editColor });
    onClose();
  };

  if (editing) {
    return (
      <Modal onClose={onClose} as="form" onSubmit={saveEdit}>
        <h2 className="modal__title">Edit space</h2>
        <label className="modal__field">
          <span>Name</span>
          <input
            className="modal__input"
            placeholder="Space name"
            maxLength={100}
            autoFocus
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
          />
          <span className="modal__counter">{editName.length}/100</span>
        </label>
        <div className="modal__field">
          <span>Color</span>
          <div className="modal__swatches">
            {WORKSPACE_COLOR_NAMES.map((color) => (
              <button
                key={color}
                type="button"
                className="modal__swatch"
                data-active={editColor === color}
                style={{ background: colorHex(color) }}
                aria-label={color}
                title={color}
                onClick={() => setEditColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="modal__actions">
          {detail.isOwner && detail.type === 'SHARED' && (
            <button type="button" className="modal__btn modal__btn--danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <span className="modal__spacer" />
          <button type="button" className="modal__btn modal__btn--ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button type="submit" className="modal__btn modal__btn--primary" disabled={!editName.trim()}>
            Save
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="modal__title modal__title--clamp">{detail.name}</h2>
      <div className="modal__view">
        <div className="modal__view-row">
          <span>Type</span>
          <b>{detail.type === 'PERSONAL' ? 'Personal' : 'Shared'}</b>
        </div>
        <div className="modal__view-row">
          <span>Color</span>
          <b className="modal__view-color">
            <span className="modal__view-dot" style={{ background: colorHex(detail.color) }} />
            {colorLabel(detail.color)}
          </b>
        </div>
        {detail.type === 'SHARED' && (
          <div className="modal__view-row">
            <span>Members</span>
            <b>{detail.members.length}</b>
          </div>
        )}
        {detail.created && (
          <div className="modal__view-row">
            <span>Created</span>
            <b>
              {new Date(detail.created).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </b>
          </div>
        )}
      </div>
      <div className="modal__actions">
        {detail.isOwner && detail.type === 'SHARED' && (
          <button type="button" className="modal__btn modal__btn--danger" onClick={onDelete}>
            Delete
          </button>
        )}
        {!detail.isOwner && detail.type === 'SHARED' && (
          <button type="button" className="modal__btn modal__btn--danger" onClick={onLeave}>
            Leave
          </button>
        )}
        <span className="modal__spacer" />
        <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
          Close
        </button>
        {canEdit && (
          <button type="button" className="modal__btn modal__btn--primary" onClick={startEdit}>
            Edit
          </button>
        )}
      </div>
    </Modal>
  );
}
