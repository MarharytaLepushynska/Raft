package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload containing credentials to log in to the planning app.
 */
@Data
public class LoginRequest {
    /** The user's email or unique username. */
    @NotBlank(message = "Email or username is required")
    private String login;

    /** The user's account password. */
    @NotBlank(message = "Password is required")
    private String password;
}
