package org.naukma.raft.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Representation framework defining scheduled alarms linked to tasks or calendar blocks.
 */
@Data
@Builder
public class ReminderResponse {

    private String id;

    private String taskId;

    private String eventId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime reminderTime;

    private boolean sent;
}