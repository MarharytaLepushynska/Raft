package org.naukma.raft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload to modify the current user's personal profile settings.
 */
@Data
public class ProfileUpdateRequest {
    /** The unique display handle or username. */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$",
             message = "Username may contain only letters, digits, dot, underscore and hyphen")
    private String username;

    /** The profile email address used for system access and sync. */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;

    /** The user's real first name. */
    @NotBlank(message = "Firstname is required")
    @Size(max = 50, message = "First name must be at most 50 characters")
    private String firstName;

    /** The user's real last name. */
    @NotBlank(message = "Lastname is required")
    @Size(max = 50, message = "Last name must be at most 50 characters")
    private String lastName;

    /** Path or image URL for the user's avatar icon. */
    @Pattern(regexp = "^(https?://.+|/[A-Za-z0-9._\\-/]+)?$", message = "Avatar must be a valid path or URL")
    private String avatar;
}
