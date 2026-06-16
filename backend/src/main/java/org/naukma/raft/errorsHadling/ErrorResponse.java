package org.naukma.raft.errorsHadling;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Standard data structure for returning error details to the frontend client.
 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    /** The HTTP status code of the error. */
    private int status;
    /** Descriptive details explaining what went wrong. */
    private String message;
    /** The date and time when the error took place. */
    private LocalDateTime timestamp;

    public ErrorResponse(int status, String message) {
        this.status = status;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
}
