package org.naukma.raft.errorsHadling;

/**
 * Thrown when an operation conflicts with the current state of workspace resources.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
