package org.naukma.raft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

/**
 * Payload capturing data credentials to register a brand-new profile into the platform system.
 */
@Data
public class UserRequest {
    /** Chosen unique platform identification handle. */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$",
             message = "Username may contain only letters, digits, dot, underscore and hyphen")
    private String username;

    /** Contact email registration path mapped to account verification keys. */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;

    /** Clear-text secret password string used to secure future entry points. */
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
             message = "Password must contain at least one letter and one digit")
    private String password;

    /** The new member's first name. */
    @NotBlank(message = "Firstname is required")
    @Size(max = 50, message = "First name must be at most 50 characters")
    private String firstName;

    /** The new member's last name. */
    @NotBlank(message = "Lastname is required")
    @Size(max = 50, message = "Last name must be at most 50 characters")
    private String lastName;

    /** Optional profile image path link configuration. */
    @URL(message = "Invalid URL")
    private String avatar;

}
