package org.naukma.raft.errorsHadling;

/**
 * Thrown when a requested resource, such as a specific task, note, or workspace, cannot be found.
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
