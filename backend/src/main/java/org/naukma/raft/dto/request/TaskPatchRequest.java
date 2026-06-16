package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Payload to modify properties, progress state, or targets of an existing checklist task.
 */
@Data
public class TaskPatchRequest {
    /** The updated title for the task card. */
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** Updated contextual notes or assignment checklist text. */
    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    /** Updated urgency priority rank for sorting the agenda layout. */
    private TaskPriority priority;

    /** Shifted target deadline completion date. */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    /** Shifted hourly deadline limit for execution. */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime dueTime;

    /** Updated execution or completion progress status (e.g., TODO, IN_PROGRESS, DONE). */
    private TaskStatus status;

    /** The assigned team member responsible for executing this task. */
    private Long assigneeId;
}
