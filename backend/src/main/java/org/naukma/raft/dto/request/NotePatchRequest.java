package org.naukma.raft.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload to update the title or content of an existing note.
 */
@Data
public class NotePatchRequest {
    /** The updated title of the note. */
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** The updated text content of the note body. */
    @Size(max = 10000, message = "Content must be at most 10 000characters")
    private String content;
}
