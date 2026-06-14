package org.naukma.raft.dto.response;

import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.MemberRole;

@Data
@Builder
public class MemberResponse {
    private String id;
    private String userId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String avatar;
    private MemberRole role;
}
