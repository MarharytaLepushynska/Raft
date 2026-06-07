package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class TaskRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime dueTime;

    @NotNull(message = "Status is required")
    private TaskStatus status;
}
