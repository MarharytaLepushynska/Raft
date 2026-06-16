package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Payload to append a fresh task or checklist entry into the agenda logs.
 */
@Data
public class TaskRequest {
    /** The explicit name or summary text of the task. */
    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** Extended details or contextual objective requirements for the task card. */
    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    /** Initial target priority level assigned to the work card. */
    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    /** Target deadline target completion calendar day. */
    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    /** Exact hourly deadline threshold time for task completion. */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime dueTime;

    /** Initial workflow checklist status indicator. */
    @NotNull(message = "Status is required")
    private TaskStatus status;

    /** Shared environment workspace scope identifier mapping where this task belongs. */
    private Long workspaceId;

    /** Targeted group member account reference mapped to execute this task. */
    private Long assigneeId;
}
