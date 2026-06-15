package org.naukma.raft.dto.response.stats;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkspaceTaskCountResponse {
    private Long workspaceId;
    private String workspaceName;
    private Long taskCount;
}
