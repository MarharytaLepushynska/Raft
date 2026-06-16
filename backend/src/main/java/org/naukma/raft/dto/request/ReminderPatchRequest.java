package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;

/**
 * Payload to alter the settings or trigger bounds of an active alert notification.
 */
@Data
public class ReminderPatchRequest {

    /** Optional task reference linked to this alert. */
    private Long taskId;

    /** Optional calendar event reference linked to this alert. */
    private Long eventId;

    /** The updated future timestamp to dispatch the planning alert prompt. */
    @Future(message = "Reminder time must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime reminderTime;
}