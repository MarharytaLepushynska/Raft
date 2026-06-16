package org.naukma.raft.dto.response.stats;

import lombok.Builder;
import lombok.Data;

/**
 * Summary layout showing task distribution volumes for a specific workspace.
 */
@Data
@Builder
public class WorkspaceTaskCountResponse {
    /** Unique reference ID of the analyzed workspace environment. */
    private Long workspaceId;
    /** Display name of the workspace board. */
    private String workspaceName;
    /** Total tally of active or managed tasks in this environment. */
    private Long taskCount;
}
