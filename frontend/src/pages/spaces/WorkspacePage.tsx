import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { deleteWorkspace, getWorkspace, updateWorkspace } from '@/api/workspaces';
import { WorkspaceTasks } from './WorkspaceTasks';
import { WorkspaceMembers } from './WorkspaceMembers';
import { colorHex, WORKSPACE_COLOR_NAMES } from '@/lib/workspaceColors';
import type { Member, WorkspaceColor, WorkspaceDetail } from '@/types/workspace';
import './WorkspacePage.css';

export function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<WorkspaceColor>('ROSE');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getWorkspace(id)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch(() => {
        if (active) setDetail(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && detail && detail.role === 'ADMIN') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditName(detail.name);
      setEditColor(detail.color ?? 'ROSE');
      setEditOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, detail, setSearchParams]);

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    const name = editName.trim();
    if (!name) return;
    const updated = await updateWorkspace(detail.id, { name, color: editColor });
    setDetail({ ...detail, name: updated.name, color: updated.color });
    window.dispatchEvent(
      new CustomEvent('workspace-updated', {
        detail: { id: detail.id, name: updated.name, color: updated.color },
      }),
    );
    setEditOpen(false);
  };

  const confirmDelete = async () => {
    if (!detail) return;
    await deleteWorkspace(detail.id);
    navigate('/spaces');
  };

  const back = (
    <button type="button" className="wpage__back" onClick={() => navigate('/spaces')}>
      <Icon name="chevron-left" size={18} />
      Spaces
    </button>
  );

  if (loading) {
    return (
      <div className="wpage">
        {back}
        <p className="wpage__muted">Loading&hellip;</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="wpage">
        {back}
        <p className="wpage__muted">Space not found.</p>
      </div>
    );
  }

  const isAdmin = detail.role === 'ADMIN';
  const canManage = isAdmin && detail.type === 'SHARED';

  return (
    <div className="wpage">
      <div className="wpage__top">{back}</div>

      <div className="wpage__columns" data-single={detail.type !== 'SHARED'}>
        <WorkspaceTasks workspaceId={detail.id} detail={detail} currentUserId={user?.id} />

        {detail.type === 'SHARED' && (
          <aside className="wpage__side">
            <WorkspaceMembers
              workspaceId={detail.id}
              members={detail.members}
              canManage={canManage}
              currentUserId={user?.id}
              onChange={(members: Member[]) => setDetail({ ...detail, members })}
            />
          </aside>
        )}
      </div>

      {editOpen && (
        <div className="wmodal" role="dialog" aria-modal="true">
          <div className="wmodal__scrim" onClick={() => setEditOpen(false)} />
          <form className="wmodal__card" onSubmit={saveEdit}>
            <h2 className="wmodal__title">Edit space</h2>
            <input
              className="wmodal__input"
              placeholder="Space name"
              maxLength={100}
              autoFocus
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
            <div className="wmodal__swatches">
              {WORKSPACE_COLOR_NAMES.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="wmodal__swatch"
                  data-active={editColor === color}
                  style={{ background: colorHex(color) }}
                  aria-label={color}
                  title={color}
                  onClick={() => setEditColor(color)}
                />
              ))}
            </div>
            <div className="wmodal__actions">
              {detail.type === 'SHARED' && (
                <button
                  type="button"
                  className="wmodal__btn wmodal__btn--danger"
                  onClick={() => {
                    setEditOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  Delete
                </button>
              )}
              <span className="wmodal__spacer" />
              <button type="button" className="wmodal__btn wmodal__btn--ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="wmodal__btn wmodal__btn--primary" disabled={!editName.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteOpen && (
        <div className="wmodal" role="dialog" aria-modal="true">
          <div className="wmodal__scrim" onClick={() => setDeleteOpen(false)} />
          <div className="wmodal__card wmodal__card--confirm">
            <h2 className="wmodal__title">Delete space?</h2>
            <p className="wmodal__text">
              This permanently deletes &ldquo;{detail.name}&rdquo; and all its tasks. This can&rsquo;t be undone.
            </p>
            <div className="wmodal__actions">
              <span className="wmodal__spacer" />
              <button type="button" className="wmodal__btn wmodal__btn--ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button type="button" className="wmodal__btn wmodal__btn--danger-solid" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
