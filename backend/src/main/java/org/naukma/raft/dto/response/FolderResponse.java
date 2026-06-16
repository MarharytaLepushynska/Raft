package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.FolderType;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;

import java.time.LocalDateTime;

/**
 * Representation of an asset binder used to catalog tasks or documents on view structures.
 */
@Data
@Builder
public class FolderResponse {
    private String id;
    private String name;
    private FolderType folderType;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime created;

    private String workspaceId;
    private String workspaceName;
    private WorkspaceColor workspaceColor;
    private WorkspaceType workspaceType;

    private boolean canEdit;
    private UserSummaryResponse owner;
}
