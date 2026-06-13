package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;

@Data
public class ReminderPatchRequest {

    private Long taskId;

    private Long eventId;

    @Future(message = "Reminder time must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime reminderTime;
}