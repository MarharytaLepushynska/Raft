package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.MemberRole;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;

/**
 * Overview layout outlining a single collaborative work space card row.
 */
@Data
@Builder
public class WorkspaceResponse {
    private String id;
    private String name;
    private WorkspaceType type;
    private WorkspaceColor color;
    private MemberRole role;
    private int memberCount;
}
