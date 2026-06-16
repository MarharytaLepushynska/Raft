package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.MemberRole;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Deep view payload containing meta configurations and the active member roster for a specific space.
 */
@Data
@Builder
public class WorkspaceDetailResponse {
    private String id;
    private String name;
    private WorkspaceType type;
    private WorkspaceColor color;
    private MemberRole role;

    @JsonProperty("isOwner")
    private boolean isOwner;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime created;

    private List<MemberResponse> members;
}
