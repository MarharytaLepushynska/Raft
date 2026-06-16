package org.naukma.raft.errorsHadling;

/**
 * Thrown during registration if the provided email address is already taken in the planning app.
 */
public class EmailAreadyExsistsException extends RuntimeException {
    public EmailAreadyExsistsException(String message) {
        super(message);
    }
}
