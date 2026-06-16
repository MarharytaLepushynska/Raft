package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Data transfer object used to schedule a new calendar event within a specific timeline context.
 */
@Data
public class EventRequest {

    /** Name or main objective of the scheduled calendar slot. */
    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** Contextual information or contextual brief for the timeline slot. */
    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    /** Direct starting boundaries of the event. */
    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime startTime;

    /** Direct closing boundaries of the event. */
    @NotNull(message = "End time is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endTime;

    /** Optional workspace entity reference ID if shared among environments. */
    private Long workspaceId;
}