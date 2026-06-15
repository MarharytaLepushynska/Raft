import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { deleteWorkspace, getWorkspace, leaveWorkspace } from '@/api/workspaces';
import { WorkspaceTasks } from './WorkspaceTasks';
import { WorkspaceTimeline } from './WorkspaceTimeline';
import { WorkspaceNotes } from './WorkspaceNotes';
import { WorkspaceMembers } from './WorkspaceMembers';
import { WorkspaceInfoModal } from './WorkspaceInfoModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WorkspaceExpenses } from '@/components/workspaceExpenses/WorkspaceExpenses.tsx';
import type { Member, WorkspaceColor, WorkspaceDetail } from '@/types/workspace';
import './WorkspacePage.css';

export function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

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
    if (searchParams.get('edit') === '1' && detail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInfoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, detail, setSearchParams]);

  const onWorkspaceUpdated = (changes: { name: string; color: WorkspaceColor }) => {
    if (!detail) return;
    setDetail({ ...detail, name: changes.name, color: changes.color });
    window.dispatchEvent(
      new CustomEvent('workspace-updated', {
        detail: { id: detail.id, name: changes.name, color: changes.color },
      }),
    );
  };

  const confirmDelete = async () => {
    if (!detail) return;
    await deleteWorkspace(detail.id);
    navigate('/spaces');
  };

  const confirmLeave = async () => {
    if (!detail) return;
    await leaveWorkspace(detail.id);
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

      <div className="wpage__columns">
        <WorkspaceTasks workspaceId={detail.id} detail={detail} currentUserId={user?.id} />

        <aside className="wpage__side">
          <WorkspaceTimeline workspaceId={detail.id} color={detail.color} />
          <WorkspaceNotes workspaceId={detail.id} />
          <WorkspaceExpenses workspaceId={detail.id} members={detail.members} />
          {detail.type === 'SHARED' && (
            <WorkspaceMembers
              workspaceId={detail.id}
              members={detail.members}
              canManage={canManage}
              currentUserId={user?.id}
              onChange={(members: Member[]) => setDetail({ ...detail, members })}
            />
          )}
        </aside>
      </div>

      {infoOpen && (
        <WorkspaceInfoModal
          detail={detail}
          canEdit={isAdmin}
          onClose={() => setInfoOpen(false)}
          onUpdated={onWorkspaceUpdated}
          onDelete={() => {
            setInfoOpen(false);
            setDeleteOpen(true);
          }}
          onLeave={() => {
            setInfoOpen(false);
            setLeaveOpen(true);
          }}
        />
      )}

      {deleteOpen && (
        <ConfirmModal
          title="Delete space?"
          text={
            <>
              This permanently deletes &ldquo;{detail.name}&rdquo; and all its tasks. This can&rsquo;t be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {leaveOpen && (
        <ConfirmModal
          title="Leave space?"
          text={<>Are you sure you want to leave &ldquo;{detail.name}&rdquo;?</>}
          confirmLabel="Leave"
          onConfirm={confirmLeave}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
}
