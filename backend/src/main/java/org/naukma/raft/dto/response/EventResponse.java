package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.WorkspaceColor;

import java.time.LocalDateTime;

/**
 * Formatted payload modeling a timeline block entry inside the calendar dashboard.
 */
@Data
@Builder
public class EventResponse {

    private String id;
    private String title;
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endTime;

    private String workspaceId;
    private String workspaceName;
    private WorkspaceColor workspaceColor;
}