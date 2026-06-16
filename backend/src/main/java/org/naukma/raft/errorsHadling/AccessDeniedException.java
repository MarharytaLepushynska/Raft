package org.naukma.raft.errorsHadling;

/**
 * Thrown when a user attempts to access or modify a planning item or workspace without permission.
 */
public class AccessDeniedException extends RuntimeException{
    public AccessDeniedException(String message) {
        super(message);
    }
}
