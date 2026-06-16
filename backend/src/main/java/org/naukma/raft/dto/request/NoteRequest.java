package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Payload to create a new text note in the planning app.
 */
@Data
public class NoteRequest {
    /** The title of the note. */
    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    /** The main text body of the note. */
    @Size(max = 10000, message = "Content must be at most 10 000characters")
    private String content;

    /** The ID of the folder where this note should be saved. */
    private Long folderId;
}

