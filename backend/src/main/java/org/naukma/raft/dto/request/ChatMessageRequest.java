package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Data transfer object for sending a new text message to a workspace chat.
 */
@Data
public class ChatMessageRequest {

    /** The text content of the message. */
    @NotBlank
    @Size(max = 3000)
    private String content;
}