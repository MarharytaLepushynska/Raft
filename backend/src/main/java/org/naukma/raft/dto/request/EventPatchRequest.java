package org.naukma.raft.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Data transfer object representing optional delta updates for an existing calendar event.
 */
@Data
public class EventPatchRequest {

    /** New calendar entry header text. */
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** New extra description or summary info for the timeline block. */
    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    /** Shifted calendar cell starting timestamp. */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime startTime;

    /** Shifted calendar cell closing timestamp. */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endTime;
}