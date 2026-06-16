package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Payload to schedule an automated reminder alert for tasks or calendar timelines.
 */
@Data
public class ReminderRequest {

    /** Optional planning task reference targeted for notification warnings. */
    private Long taskId;

    /** Optional calendar timeline block targeted for notification warnings. */
    private Long eventId;

    /** The exact future trigger timestamp required to push out the scheduled reminder. */
    @NotNull(message = "Reminder time is required")
    @Future(message = "Reminder time must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime reminderTime;
}