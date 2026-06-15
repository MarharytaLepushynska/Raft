import type { WorkspaceTaskCountResponse } from '@/types/statistics';

interface Props {
    workspaces: WorkspaceTaskCountResponse[];
}

export function TopWorkspacesList({ workspaces }: Props) {
    return (
        <div className="top-workspaces">
            <p className="top-workspaces__title">Top workspaces by assigned tasks</p>

            {workspaces.length === 0 ? (
                <p className="we__list-empty">No tasks assigned yet.</p>
            ) : (
                <div className="top-workspaces__list">
                    {workspaces.map((ws) => (
                        <div key={ws.workspaceId} className="top-workspaces__row">
                            <span className="top-workspaces__name">{ws.workspaceName}</span>
                            <span className="top-workspaces__count">{ws.taskCount}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
