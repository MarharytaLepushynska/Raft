package org.naukma.raft.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Session allocation payload containing authentication context upon successful sign-in.
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;
}

