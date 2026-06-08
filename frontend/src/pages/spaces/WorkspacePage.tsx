import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { useAuth } from '@/auth/AuthContext';
import { errorMessage } from '@/api/http';
import { addMember, deleteWorkspace, getWorkspace, removeMember, updateWorkspace } from '@/api/workspaces';
import { createTask, deleteTask, getTasks, updateTask } from '@/api/tasks';
import { TaskModal } from '@/components/task/TaskModal';
import { UserSuggestions } from '@/components/common/UserSuggestions';
import { MultiSelectFilter } from '@/components/common/MultiSelectFilter';
import { SingleSelectFilter } from '@/components/common/SingleSelectFilter';
import {
  byDeadline,
  byPriority,
  formatTaskDue,
  getTaskState,
  nextStatus,
  PRIORITIES,
  priorityColors,
  priorityLabels,
  statusLabels,
} from '@/lib/tasks';
import { useUserSuggestions } from '@/lib/useUserSuggestions';
import { colorHex, WORKSPACE_COLOR_NAMES } from '@/lib/workspaceColors';
import type { Task } from '@/types/task';
import type { WorkspaceColor, WorkspaceDetail } from '@/types/workspace';
import './WorkspacePage.css';

type StatusFilter = 'all' | 'active' | 'completed';
type SortKey = 'deadline' | 'priority';

export function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<WorkspaceColor>('ROSE');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteLogin, setInviteLogin] = useState('');
  const [memberError, setMemberError] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('deadline');
  const [showCompleted, setShowCompleted] = useState(false);
  const suggestions = useUserSuggestions(inviteLogin);

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
    if (!id) return;
    let active = true;
    getTasks()
      .then((all) => {
        if (active) setTasks(all.filter((task) => task.workspaceId === id));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const cycleStatus = async (task: Task) => {
    const updated = await updateTask(task.id, { status: nextStatus[task.status] });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const create = async (input: Omit<Task, 'id'>) => {
    const created = await createTask(input);
    if (created.workspaceId === id) setTasks((prev) => [created, ...prev]);
    setModalTask(undefined);
  };

  const update = async (taskId: string, patch: Partial<Task>) => {
    const updated = await updateTask(taskId, patch);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    setModalTask(undefined);
  };

  const remove = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setModalTask(undefined);
  };

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

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    const value = inviteLogin.trim();
    if (!value) return;
    try {
      const member = await addMember(detail.id, value);
      setDetail({ ...detail, members: [...detail.members, member] });
      setInviteLogin('');
      setMemberError('');
    } catch (err) {
      setMemberError(errorMessage(err));
    }
  };

  const kick = async (userId: string) => {
    if (!detail) return;
    try {
      await removeMember(detail.id, userId);
      setDetail({ ...detail, members: detail.members.filter((m) => m.userId !== userId) });
      setMemberError('');
    } catch (err) {
      setMemberError(errorMessage(err));
    }
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

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const donePercent = total ? (doneCount / total) * 100 : 0;
  const progressPercent = total ? (inProgressCount / total) * 100 : 0;

  const sortFn = sort === 'priority' ? byPriority : byDeadline;
  const matchesPriority = (t: Task) => priorityFilter.size === 0 || priorityFilter.has(t.priority);
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED').filter(matchesPriority).sort(sortFn);
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').filter(matchesPriority).sort(sortFn);
  const showsActive = statusFilter !== 'completed' && activeTasks.length > 0;
  const showsCompleted = statusFilter !== 'active' && completedTasks.length > 0;

  const priorityOptions = PRIORITIES.map((p) => ({ id: p, label: priorityLabels[p], color: priorityColors[p] }));

  const isAdmin = detail.role === 'ADMIN';
  const canManage = isAdmin && detail.type === 'SHARED';

  const renderTask = (task: Task) => {
    const done = task.status === 'COMPLETED';
    const overdue = getTaskState(task) === 'overdue';
    return (
      <li key={task.id} className="wpage__task" data-done={done}>
        <button
          type="button"
          className="wpage__status"
          data-status={task.status}
          onClick={() => cycleStatus(task)}
          aria-label={`Status: ${statusLabels[task.status]}, click to change`}
        >
          <span className="wpage__status-dot">{done && <Icon name="check" size={12} />}</span>
          <span className="wpage__status-tip">
            {statusLabels[task.status]}
            <span className="wpage__status-tip-sub">click to change</span>
          </span>
        </button>
        <div className="wpage__task-body" onClick={() => setModalTask(task)}>
          <div className="wpage__task-head">
            <span className="wpage__task-title">{task.title}</span>
            <span className={`wpage__task-priority wpage__task-priority--${task.priority.toLowerCase()}`}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          {task.description && <p className="wpage__task-desc">{task.description}</p>}
          <p className="wpage__task-due" data-overdue={overdue}>
            {formatTaskDue(task)}
          </p>
        </div>
      </li>
    );
  };

  return (
    <div className="wpage">
      <div className="wpage__top">{back}</div>

      <div className="wpage__columns" data-single={detail.type !== 'SHARED'}>
        <div className="wpage__main">
          <div className="wpage__tasks-head">
            <h2 className="wpage__subtitle">Tasks ({total - doneCount})</h2>
            <button type="button" className="wpage__add" onClick={() => setModalTask(null)}>
              <Icon name="plus" size={16} />
              Add task
            </button>
          </div>

          {total > 0 && (
            <div className="wpage__progress">
              <div className="wpage__progress-track">
                <span className="wpage__progress-fill wpage__progress-fill--done" style={{ width: `${donePercent}%` }} />
                <span className="wpage__progress-fill wpage__progress-fill--progress" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="wpage__progress-label">
                {doneCount} of {total} done · {percent}%
              </span>
            </div>
          )}

          {total > 0 && (
            <div className="wpage__filters">
              <div className="wpage__chips">
                {(['all', 'active', 'completed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="wpage__chip"
                    data-active={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                  >
                    {value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
              <MultiSelectFilter
                options={priorityOptions}
                selected={priorityFilter}
                onChange={setPriorityFilter}
                allLabel="All priorities"
                countNoun="priorities"
              />
              <SingleSelectFilter
                options={[
                  { id: 'deadline', label: 'By date' },
                  { id: 'priority', label: 'By priority' },
                ]}
                value={sort}
                onChange={(value) => setSort(value as SortKey)}
              />
            </div>
          )}

          {total === 0 ? (
            <p className="wpage__muted">No tasks in this space yet.</p>
          ) : !showsActive && !showsCompleted ? (
            <p className="wpage__muted">No tasks match the filters.</p>
          ) : (
            <>
              {showsActive && <ul className="wpage__list">{activeTasks.map(renderTask)}</ul>}

              {showsCompleted && (
                statusFilter === 'completed' ? (
                  <ul className="wpage__list">{completedTasks.map(renderTask)}</ul>
                ) : (
                  <div className="wpage__completed">
                    <button
                      type="button"
                      className="wpage__completed-toggle"
                      data-open={showCompleted}
                      onClick={() => setShowCompleted((value) => !value)}
                    >
                      <Icon name="chevron-down" size={16} />
                      Completed ({completedTasks.length})
                    </button>
                    {showCompleted && (
                      <ul className="wpage__list wpage__completed-list">{completedTasks.map(renderTask)}</ul>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </div>

        {detail.type === 'SHARED' && (
          <aside className="wpage__side">
            <section className="wpage__members-widget">
              <h2 className="wpage__subtitle">Members ({detail.members.length})</h2>
              {memberError && <div className="wpage__error">{memberError}</div>}
              <ul className="wpage__members">
                {detail.members.map((member) => {
                  const isYou = member.userId === user?.id;
                  return (
                    <li key={member.id} className="wpage__member">
                      <span className="wpage__avatar">
                        {(member.firstName[0] ?? '') + (member.lastName[0] ?? '')}
                      </span>
                      <div className="wpage__member-info">
                        <span className="wpage__member-name">
                          {member.firstName} {member.lastName}
                          {isYou && <span className="wpage__you"> (you)</span>}
                        </span>
                        <span className="wpage__member-username">@{member.username}</span>
                      </div>
                      {canManage && member.role !== 'ADMIN' && (
                        <button
                          type="button"
                          className="wpage__member-remove"
                          aria-label={`Remove ${member.firstName}`}
                          onClick={() => kick(member.userId)}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {canManage && (
                <form className="wpage__invite" onSubmit={invite}>
                  <div className="wpage__invite-field">
                    <input
                      type="text"
                      placeholder="Invite by email or username"
                      autoComplete="off"
                      value={inviteLogin}
                      onChange={(event) => {
                        setInviteLogin(event.target.value);
                        setShowSuggest(true);
                      }}
                      onFocus={() => setShowSuggest(true)}
                      onBlur={() => setShowSuggest(false)}
                    />
                    {showSuggest && (
                      <UserSuggestions
                        users={suggestions.filter(
                          (u) => !detail.members.some((m) => m.username === u.username),
                        )}
                        onPick={(u) => {
                          setInviteLogin(u.username);
                          setShowSuggest(false);
                        }}
                      />
                    )}
                  </div>
                  <button type="submit" disabled={!inviteLogin.trim()}>
                    Add
                  </button>
                </form>
              )}
            </section>
          </aside>
        )}
      </div>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          defaultWorkspaceId={id}
          onClose={() => setModalTask(undefined)}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      )}

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
