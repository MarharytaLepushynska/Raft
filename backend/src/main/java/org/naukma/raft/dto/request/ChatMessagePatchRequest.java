package org.naukma.raft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Data transfer object for updating the content of an existing chat message.
 */
@Data
public class ChatMessagePatchRequest {

    /** The revised text message body. */
    @NotBlank
    @Size(max = 3000)
    private String content;
}