package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;
import org.naukma.raft.enums.WorkspaceColor;
import org.naukma.raft.enums.WorkspaceType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Detailed representation of a planning task card, complete with assignment contexts.
 */
@Data
@Builder
public class TaskResponse {
    private String id;
    private String title;
    private String description;
    private TaskPriority priority;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime dueTime;

    private TaskStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime created;

    private String workspaceId;
    private String workspaceName;
    private WorkspaceColor workspaceColor;
    private WorkspaceType workspaceType;

    private UserSummaryResponse creator;
    private UserSummaryResponse assignee;
}
