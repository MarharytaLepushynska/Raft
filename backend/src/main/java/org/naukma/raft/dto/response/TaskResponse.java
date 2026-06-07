package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.naukma.raft.enums.TaskPriority;
import org.naukma.raft.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalTime;

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
}
