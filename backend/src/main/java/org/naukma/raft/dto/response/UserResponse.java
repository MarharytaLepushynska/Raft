package org.naukma.raft.dto.response;

import lombok.Data;

/**
 * Primary container holding full user account information for self-view layouts.
 */
@Data
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String avatar;
}
