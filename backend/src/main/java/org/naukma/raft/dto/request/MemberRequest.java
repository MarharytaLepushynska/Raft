package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.naukma.raft.enums.MemberRole;

/**
 * Payload to invite a member or change their role in a shared workspace.
 */
@Data
public class MemberRequest {
    /** The username or email of the user to manage. */
    @NotBlank(message = "Login is required")
    private String login;

    /** The role assigned to the member (e.g., ADMIN, MEMBER). */
    private MemberRole role;
}
