package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;

import java.util.List;

/**
 * Payload used to provision a brand-new workspace for team collaboration or scheduling partitions.
 */
@Data
public class WorkspaceRequest {
    /** The main title or branding name of the workspace board. */
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    /** Visual color tag attribute chosen to highlight this environment. */
    private WorkspaceColor color;

    /** Functional type configuration distinguishing personal tracks from teamwork spaces. */
    private WorkspaceType type;

    /** Pre-selected list of user logins or contact addresses to enroll as initial teammates. */
    private List<String> memberLogins;
}
