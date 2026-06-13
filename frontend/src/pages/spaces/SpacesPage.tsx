import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/lib/icons';
import { errorMessage } from '@/api/http';
import { createWorkspace, getWorkspaces } from '@/api/workspaces';
import { searchUsers } from '@/api/user';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { UserSuggestions } from '@/components/common/UserSuggestions';
import { colorHex, WORKSPACE_COLOR_NAMES } from '@/lib/workspaceColors';
import { useUserSuggestions } from '@/hooks/common/useUserSuggestions';
import type { User } from '@/types/user';
import type { Workspace, WorkspaceColor, WorkspaceType } from '@/types/workspace';
import './SpacesPage.css';

export function SpacesPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<WorkspaceColor>('ROSE');
  const [newType, setNewType] = useState<WorkspaceType>('SHARED');
  const [memberLogins, setMemberLogins] = useState<string[]>([]);
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const suggestions = useUserSuggestions(loginInput);

  const addUser = (user: User) => {
    if (!memberLogins.includes(user.username)) {
      setMemberLogins((prev) => [...prev, user.username]);
    }
    setLoginInput('');
    setShowSuggest(false);
    setError('');
  };

  const matchUser = (users: User[], value: string) =>
    users.find((u) => u.username.toLowerCase() === value.toLowerCase());

  const addLogin = async () => {
    const value = loginInput.trim();
    if (!value) return;
    const match = matchUser(suggestions, value);
    if (match) {
      addUser(match);
      return;
    }
    try {
      const found = matchUser(await searchUsers(value), value);
      if (found) addUser(found);
      else setError(`No user found for "${value}"`);
    } catch {
      setError('Could not verify that user');
    }
  };

  const removeLogin = (value: string) =>
    setMemberLogins((prev) => prev.filter((v) => v !== value));

  useEffect(() => {
    getWorkspaces().then((all) => {
      setWorkspaces(all);
      setLoading(false);
    });
  }, []);

  const open = (id: string) => navigate(`/spaces/${id}`);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const ws = await createWorkspace(name, {
        color: newColor,
        type: newType,
        memberLogins: newType === 'SHARED' ? memberLogins : [],
      });
      setCreateOpen(false);
      setNewName('');
      setNewColor('ROSE');
      setNewType('SHARED');
      setMemberLogins([]);
      setLoginInput('');
      setError('');
      navigate(`/spaces/${ws.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const filtered = search.trim()
    ? workspaces.filter((w) => w.name.toLowerCase().includes(search.trim().toLowerCase()))
    : workspaces;

  return (
    <div className="spaces">
      <header className="spaces__head">
        <div className="spaces__search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search spaces"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="spaces__add" onClick={() => setCreateOpen(true)} aria-label="New space">
          <Icon name="plus" size={22} />
        </button>
      </header>

      {loading ? (
        <p className="spaces__muted">Loading&hellip;</p>
      ) : workspaces.length === 0 ? (
        <p className="spaces__muted">No spaces yet — create your first one.</p>
      ) : filtered.length === 0 ? (
        <p className="spaces__muted">No spaces match your search.</p>
      ) : (
        <div className="spaces__grid">
          {filtered.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} onOpen={open} />
          ))}
        </div>
      )}

      {createOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__scrim" onClick={() => setCreateOpen(false)} />
          <form className="modal__card modal__card--scroll" onSubmit={create}>
            <h2 className="modal__title">New space</h2>
            {error && <div className="modal__error">{error}</div>}
            <label className="modal__field">
              <span>Name</span>
              <input
                className="modal__input"
                placeholder="Space name"
                maxLength={100}
                autoFocus
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <span className="modal__counter">{newName.length}/100</span>
            </label>

            <div className="modal__field">
              <span>Type</span>
              <div className="modal__types">
                <button
                  type="button"
                  className="modal__type"
                  data-active={newType === 'PERSONAL'}
                  onClick={() => setNewType('PERSONAL')}
                >
                  Private
                </button>
                <button
                  type="button"
                  className="modal__type"
                  data-active={newType === 'SHARED'}
                  onClick={() => setNewType('SHARED')}
                >
                  Shared
                </button>
              </div>
            </div>

            <div className="modal__field">
              <span>Color</span>
              <div className="modal__swatches">
                {WORKSPACE_COLOR_NAMES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="modal__swatch"
                    data-active={newColor === color}
                    style={{ background: colorHex(color) }}
                    aria-label={color}
                    title={color}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>

            {newType === 'SHARED' && (
              <div className="modal__field">
                <span>Members (optional)</span>
                <div className="modal__invite-add">
                <div className="modal__email-row">
                  <div className="modal__email-field">
                    <input
                      ref={loginInputRef}
                      type="text"
                      placeholder="Add member by login"
                      autoComplete="off"
                      value={loginInput}
                      onChange={(event) => {
                        setLoginInput(event.target.value);
                        setShowSuggest(true);
                        if (error) setError('');
                      }}
                      onFocus={() => setShowSuggest(true)}
                      onBlur={() => setShowSuggest(false)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addLogin();
                        }
                      }}
                    />
                    {showSuggest && (
                      <UserSuggestions
                        anchorRef={loginInputRef}
                        users={suggestions.filter((u) => !memberLogins.includes(u.username))}
                        onPick={addUser}
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => addLogin()} disabled={!loginInput.trim()}>
                    Add
                  </button>
                </div>
                {memberLogins.length > 0 && (
                  <div className="modal__email-chips">
                    {memberLogins.map((value) => (
                      <span key={value} className="modal__email-chip">
                        <span className="modal__email-chip-text">{value}</span>
                        <button type="button" onClick={() => removeLogin(value)} aria-label={`Remove ${value}`}>
                          <Icon name="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}

            <div className="modal__actions">
              <span className="modal__spacer" />
              <button type="button" className="modal__btn modal__btn--ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="modal__btn modal__btn--primary" disabled={!newName.trim()}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
