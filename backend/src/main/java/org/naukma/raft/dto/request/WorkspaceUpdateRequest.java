package org.naukma.raft.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.naukma.raft.enums.WorkspaceColor;

/**
 * Payload containing metadata updates for an existing shared planning environment.
 */
@Data
public class WorkspaceUpdateRequest {
    /** Optional modified display name configuration for the workspace board. */
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    /** Updated dashboard sidebar accent color identifier. */
    private WorkspaceColor color;
}
