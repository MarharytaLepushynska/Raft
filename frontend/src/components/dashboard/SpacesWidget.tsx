import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWorkspaces } from '@/api/workspaces';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import type { Workspace } from '@/types/workspace';
import './SpacesWidget.css';

const MAX = 3;

/** Dashboard section: a few recent workspaces as cards, linking to the spaces page. */
export function SpacesWidget() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getWorkspaces()
      .then((all) => {
        if (active) setWorkspaces(all);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const recent = [...workspaces].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, MAX);

  return (
    <section className="dash-spaces">
      <header className="dash-spaces__head">
        <h2 className="dash-spaces__title">Spaces</h2>
        {workspaces.length > 0 && (
          <Link to="/spaces" className="dash-spaces__view-all">
            Show all ({workspaces.length})
          </Link>
        )}
      </header>

      {loading ? (
        <p className="dash-spaces__muted">Loading&hellip;</p>
      ) : error ? (
        <p className="dash-spaces__muted">Couldn&rsquo;t load spaces.</p>
      ) : workspaces.length === 0 ? (
        <p className="dash-spaces__muted">No spaces yet.</p>
      ) : (
        <div
          className="dash-spaces__grid"
          style={{ gridTemplateColumns: `repeat(${recent.length}, minmax(0, 1fr))` }}
        >
          {recent.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} onOpen={(id) => navigate(`/spaces/${id}`)} />
          ))}
        </div>
      )}
    </section>
  );
}
